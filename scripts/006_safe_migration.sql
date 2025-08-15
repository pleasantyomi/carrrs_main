-- Safe Migration: Update tables for enhanced host listing system
-- This script safely adds new fields and tables, checking for existing structures

-- 1. Safely update profiles table to include listing_types
DO $$
BEGIN
  -- Add listing_types column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'listing_types') THEN
    ALTER TABLE profiles ADD COLUMN listing_types TEXT[] DEFAULT '{}';
  END IF;
  
  -- Update existing hosts to have all listing types for backward compatibility
  UPDATE profiles 
  SET listing_types = ARRAY['cars', 'services', 'experiences'] 
  WHERE role = 'host' AND (listing_types IS NULL OR array_length(listing_types, 1) IS NULL);
END $$;

-- 2. Safely update cars table
DO $$
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'status') THEN
    ALTER TABLE cars ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance'));
    -- Update all existing cars to active status
    UPDATE cars SET status = 'active' WHERE status IS NULL;
  END IF;
END $$;

-- 3. Safely create stays table
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

-- 4. Safely update services table
DO $$
BEGIN
  -- Add category column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') THEN
    ALTER TABLE services ADD COLUMN category TEXT;
  END IF;
  
  -- Add duration column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'duration') THEN
    ALTER TABLE services ADD COLUMN duration DECIMAL(4,2); -- Duration in hours
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'status') THEN
    ALTER TABLE services ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance'));
    -- Update all existing services to active status
    UPDATE services SET status = 'active' WHERE status IS NULL;
  END IF;
  
  -- Migrate service_type to category for backward compatibility
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'service_type') THEN
    UPDATE services SET category = service_type WHERE category IS NULL AND service_type IS NOT NULL;
  END IF;
END $$;

-- 5. Enable Row Level Security for all tables (safe)
DO $$
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cars' AND rowsecurity = true) THEN
    ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'services' AND rowsecurity = true) THEN
    ALTER TABLE services ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'stays' AND rowsecurity = true) THEN
    ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 6. Create RLS policies for cars (safe)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view available cars" ON cars;
  DROP POLICY IF EXISTS "Hosts can manage own cars" ON cars;
  
  -- Create new policies with conditional status check
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'status') THEN
    CREATE POLICY "Users can view available cars" ON cars
      FOR SELECT USING (status = 'active' AND is_available = true);
  ELSE
    CREATE POLICY "Users can view available cars" ON cars
      FOR SELECT USING (is_available = true);
  END IF;
  
  CREATE POLICY "Hosts can manage own cars" ON cars
    FOR ALL USING (auth.uid() = host_id);
END $$;

-- 7. Create RLS policies for services (safe)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view available services" ON services;
  DROP POLICY IF EXISTS "Hosts can manage own services" ON services;
  
  -- Create new policies with conditional status check
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'status') THEN
    CREATE POLICY "Users can view available services" ON services
      FOR SELECT USING (status = 'active' AND is_available = true);
  ELSE
    CREATE POLICY "Users can view available services" ON services
      FOR SELECT USING (is_available = true);
  END IF;
  
  CREATE POLICY "Hosts can manage own services" ON services
    FOR ALL USING (auth.uid() = host_id);
END $$;

-- 8. Create RLS policies for stays
DROP POLICY IF EXISTS "Users can view available stays" ON stays;
CREATE POLICY "Users can view available stays" ON stays
  FOR SELECT USING (status = 'active' AND is_available = true);

DROP POLICY IF EXISTS "Hosts can manage own stays" ON stays;
CREATE POLICY "Hosts can manage own stays" ON stays
  FOR ALL USING (auth.uid() = host_id);

-- 9. Safely create indexes for better performance
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

  -- Stays indexes (table should exist by now)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stays') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stays_host_id') THEN
      CREATE INDEX idx_stays_host_id ON stays(host_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stays_status') THEN
      CREATE INDEX idx_stays_status ON stays(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stays_location') THEN
      CREATE INDEX idx_stays_location ON stays(location);
    END IF;
  END IF;

  -- Profiles index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'listing_types')
     AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_listing_types') THEN
    CREATE INDEX idx_profiles_listing_types ON profiles USING GIN(listing_types);
  END IF;
END $$;

-- 10. Create helper functions
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

-- 11. Create trigger function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Safely create triggers for updated_at
DO $$
BEGIN
  -- Cars trigger
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_cars_updated_at') THEN
    CREATE TRIGGER update_cars_updated_at
      BEFORE UPDATE ON cars
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Services trigger
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_services_updated_at') THEN
    CREATE TRIGGER update_services_updated_at
      BEFORE UPDATE ON services
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Stays trigger
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stays')
     AND NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_stays_updated_at') THEN
    CREATE TRIGGER update_stays_updated_at
      BEFORE UPDATE ON stays
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Profiles trigger
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 13. Add helpful comments
DO $$
BEGIN
  -- Add comments if tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stays') THEN
    COMMENT ON TABLE stays IS 'Table for accommodation listings by hosts';
    COMMENT ON COLUMN stays.amenities IS 'Array of amenities available in the stay';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'listing_types') THEN
    COMMENT ON COLUMN profiles.listing_types IS 'Array of listing types the host is authorized to create (cars, stays, services)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'status') THEN
    COMMENT ON COLUMN cars.status IS 'Current status of the car listing (active, inactive, maintenance)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') THEN
    COMMENT ON COLUMN services.category IS 'Category of service (automotive, cleaning, maintenance, transport, other)';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'duration') THEN
    COMMENT ON COLUMN services.duration IS 'Duration of service in hours';
  END IF;
END $$;
