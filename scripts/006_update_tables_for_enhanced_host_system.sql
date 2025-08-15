-- Migration: Update tables for enhanced host listing system
-- This script adds new fields and tables to support the enhanced host functionality

-- 1. Update profiles table to include listing_types
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS listing_types TEXT[] DEFAULT '{}';

-- Update existing hosts to have all listing types for backward compatibility
UPDATE profiles 
SET listing_types = ARRAY['cars', 'services', 'experiences'] 
WHERE role = 'host' AND (listing_types IS NULL OR array_length(listing_types, 1) IS NULL);

-- 2. Update cars table to support new fields and structure
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance'));

-- Update existing cars to have active status (only if status column was just added)
UPDATE cars SET status = 'active' WHERE status IS NULL;

-- 3. Create stays table (if not exists from previous migration)
CREATE TABLE IF NOT EXISTS stays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_per_night DECIMAL(10,2) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  max_guests INTEGER,
  location TEXT,
  images TEXT[], -- Array of Cloudinary image URLs
  amenities TEXT[], -- Array of amenities
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Update services table to support new structure
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS duration DECIMAL(4,2), -- Duration in hours (e.g., 2.5 for 2.5 hours)
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance'));

-- Update existing services (only if columns were just added)
DO $$
BEGIN
  -- Check if status column exists and update it
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'status') THEN
    UPDATE services SET status = 'active' WHERE status IS NULL;
  END IF;
  
  -- Migrate service_type to category for backward compatibility
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'service_type') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') THEN
    UPDATE services SET category = service_type WHERE category IS NULL AND service_type IS NOT NULL;
  END IF;
END $$;

-- 5. Enable Row Level Security for all tables
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for cars
DROP POLICY IF EXISTS "Users can view available cars" ON cars;
CREATE POLICY "Users can view available cars" ON cars
  FOR SELECT USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'status') 
      THEN status = 'active' AND is_available = true
      ELSE is_available = true
    END
  );

DROP POLICY IF EXISTS "Hosts can manage own cars" ON cars;
CREATE POLICY "Hosts can manage own cars" ON cars
  FOR ALL USING (auth.uid() = host_id);

-- 7. Create RLS policies for services
DROP POLICY IF EXISTS "Users can view available services" ON services;
CREATE POLICY "Users can view available services" ON services
  FOR SELECT USING (
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'status') 
      THEN status = 'active' AND is_available = true
      ELSE is_available = true
    END
  );

DROP POLICY IF EXISTS "Hosts can manage own services" ON services;
CREATE POLICY "Hosts can manage own services" ON services
  FOR ALL USING (auth.uid() = host_id);

-- 8. Create RLS policies for stays
DROP POLICY IF EXISTS "Users can view available stays" ON stays;
CREATE POLICY "Users can view available stays" ON stays
  FOR SELECT USING (status = 'active' AND is_available = true);

DROP POLICY IF EXISTS "Hosts can manage own stays" ON stays;
CREATE POLICY "Hosts can manage own stays" ON stays
  FOR ALL USING (auth.uid() = host_id);

-- 9. Create indexes for better performance (conditional)
DO $$
BEGIN
  -- Cars indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cars_host_id') THEN
    CREATE INDEX idx_cars_host_id ON cars(host_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'status') 
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cars_status') THEN
    CREATE INDEX idx_cars_status ON cars(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cars_location') THEN
    CREATE INDEX idx_cars_location ON cars(location);
  END IF;

  -- Services indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_host_id') THEN
    CREATE INDEX idx_services_host_id ON services(host_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'status') 
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_status') THEN
    CREATE INDEX idx_services_status ON services(status);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') 
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_category') THEN
    CREATE INDEX idx_services_category ON services(category);
  END IF;

  -- Stays indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stays_host_id') THEN
    CREATE INDEX idx_stays_host_id ON stays(host_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stays_status') THEN
    CREATE INDEX idx_stays_status ON stays(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stays_location') THEN
    CREATE INDEX idx_stays_location ON stays(location);
  END IF;

  -- Profiles index
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_listing_types') THEN
    CREATE INDEX idx_profiles_listing_types ON profiles USING GIN(listing_types);
  END IF;
END $$;

-- 10. Create function to validate host listing permissions
CREATE OR REPLACE FUNCTION validate_host_listing_permission(host_id UUID, listing_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = host_id 
    AND role = 'host' 
    AND listing_type = ANY(listing_types)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_cars_updated_at ON cars;
CREATE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stays_updated_at ON stays;
CREATE TRIGGER update_stays_updated_at
  BEFORE UPDATE ON stays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Insert sample stays data for testing (optional)
-- INSERT INTO stays (host_id, title, description, price_per_night, bedrooms, bathrooms, max_guests, location, images, amenities) 
-- SELECT 
--   p.id,
--   'Cozy 2BR Apartment in Victoria Island',
--   'Beautiful apartment with modern amenities in the heart of Lagos',
--   25000,
--   2,
--   2,
--   4,
--   'Victoria Island, Lagos',
--   ARRAY['https://example.com/stay1.jpg'],
--   ARRAY['WiFi', 'Air Conditioning', 'Kitchen', 'Parking']
-- FROM profiles p 
-- WHERE p.role = 'host' 
-- AND NOT EXISTS (SELECT 1 FROM stays WHERE host_id = p.id)
-- LIMIT 1;

COMMENT ON TABLE stays IS 'Table for accommodation listings by hosts';
COMMENT ON COLUMN profiles.listing_types IS 'Array of listing types the host is authorized to create (cars, stays, services)';
COMMENT ON COLUMN cars.status IS 'Current status of the car listing (active, inactive, maintenance)';
COMMENT ON COLUMN services.category IS 'Category of service (automotive, cleaning, maintenance, transport, other)';
COMMENT ON COLUMN services.duration IS 'Duration of service in hours';
COMMENT ON COLUMN stays.amenities IS 'Array of amenities available in the stay';
