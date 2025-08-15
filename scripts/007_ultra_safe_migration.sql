-- Ultra-Safe Migration: Update tables for enhanced host listing system
-- This handles existing columns and naming conflicts gracefully

-- 1. Safely update profiles table
DO $$
BEGIN
  -- Add listing_types column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'listing_types') THEN
    ALTER TABLE profiles ADD COLUMN listing_types TEXT[] DEFAULT '{}';
  END IF;
  
  -- Add driver license image columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'driver_license_front') THEN
    ALTER TABLE profiles ADD COLUMN driver_license_front TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'driver_license_back') THEN
    ALTER TABLE profiles ADD COLUMN driver_license_back TEXT;
  END IF;
  
  -- Update existing hosts to have all listing types for backward compatibility
  UPDATE profiles 
  SET listing_types = ARRAY['cars', 'services', 'stays'] 
  WHERE role = 'host' AND (listing_types IS NULL OR array_length(listing_types, 1) IS NULL);
END $$;

-- 2. Safely handle cars table
DO $$
BEGIN
  -- Check if cars table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cars') THEN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'status') THEN
      ALTER TABLE cars ADD COLUMN status TEXT DEFAULT 'active';
      -- Add constraint after adding column
      ALTER TABLE cars ADD CONSTRAINT cars_status_check CHECK (status IN ('active', 'inactive', 'maintenance'));
      -- Update all existing cars to active status
      UPDATE cars SET status = 'active' WHERE status IS NULL;
    END IF;
    
    -- Add with_driver column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'with_driver') THEN
      ALTER TABLE cars ADD COLUMN with_driver BOOLEAN DEFAULT false;
    END IF;
    
    -- Add state column if it doesn't exist (separate from location for better filtering)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'state') THEN
      ALTER TABLE cars ADD COLUMN state TEXT;
    END IF;
  END IF;
END $$;

-- 3. Safely handle services table
DO $$
BEGIN
  -- Check if services table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') THEN
      ALTER TABLE services ADD COLUMN category TEXT;
    END IF;
    
    -- Add duration column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'duration') THEN
      ALTER TABLE services ADD COLUMN duration DECIMAL(4,2);
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'status') THEN
      ALTER TABLE services ADD COLUMN status TEXT DEFAULT 'active';
      -- Add constraint after adding column
      ALTER TABLE services ADD CONSTRAINT services_status_check CHECK (status IN ('active', 'inactive', 'maintenance'));
      -- Update all existing services to active status
      UPDATE services SET status = 'active' WHERE status IS NULL;
    END IF;
    
    -- Migrate service_type to category for backward compatibility
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'service_type') THEN
      UPDATE services SET category = service_type WHERE category IS NULL AND service_type IS NOT NULL;
    END IF;
  END IF;
END $$;

-- 4. Safely handle stays table (check for existing table and column conflicts)
DO $$
BEGIN
  -- Check if stays table already exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stays') THEN
    -- Create stays table if it doesn't exist
    CREATE TABLE stays (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      price_per_night DECIMAL(10,2) NOT NULL,
      bedrooms INTEGER,
      bathrooms INTEGER,
      max_guests INTEGER,
      location TEXT,
      images TEXT[],
      amenities TEXT[],
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  ELSE
    -- Table exists, check and update columns
    -- Check if it has 'state' column instead of 'status'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'state') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'status') THEN
      -- Rename 'state' to 'status' for consistency
      ALTER TABLE stays RENAME COLUMN state TO status;
    END IF;
    
    -- Add status column if neither state nor status exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'status') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'state') THEN
      ALTER TABLE stays ADD COLUMN status TEXT DEFAULT 'active';
      ALTER TABLE stays ADD CONSTRAINT stays_status_check CHECK (status IN ('active', 'inactive', 'maintenance'));
    END IF;
    
    -- Add other missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'images') THEN
      ALTER TABLE stays ADD COLUMN images TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'amenities') THEN
      ALTER TABLE stays ADD COLUMN amenities TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'is_available') THEN
      ALTER TABLE stays ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
    END IF;
  END IF;
END $$;

-- 5. Enable Row Level Security safely
DO $$
BEGIN
  -- Enable RLS for each table if it exists and RLS is not already enabled
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cars') THEN
    ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    ALTER TABLE services ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stays') THEN
    ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 6. Create RLS policies for cars
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cars') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view available cars" ON cars;
    DROP POLICY IF EXISTS "Hosts can manage own cars" ON cars;
    
    -- Create policies based on available columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'status') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'is_available') THEN
      CREATE POLICY "Users can view available cars" ON cars
        FOR SELECT USING (status = 'active' AND is_available = true);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'is_available') THEN
      CREATE POLICY "Users can view available cars" ON cars
        FOR SELECT USING (is_available = true);
    ELSE
      CREATE POLICY "Users can view available cars" ON cars
        FOR SELECT USING (true); -- Allow all for now
    END IF;
    
    CREATE POLICY "Hosts can manage own cars" ON cars
      FOR ALL USING (auth.uid() = host_id);
  END IF;
END $$;

-- 7. Create RLS policies for services
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view available services" ON services;
    DROP POLICY IF EXISTS "Hosts can manage own services" ON services;
    
    -- Create policies based on available columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'status') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'is_available') THEN
      CREATE POLICY "Users can view available services" ON services
        FOR SELECT USING (status = 'active' AND is_available = true);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'is_available') THEN
      CREATE POLICY "Users can view available services" ON services
        FOR SELECT USING (is_available = true);
    ELSE
      CREATE POLICY "Users can view available services" ON services
        FOR SELECT USING (true); -- Allow all for now
    END IF;
    
    CREATE POLICY "Hosts can manage own services" ON services
      FOR ALL USING (auth.uid() = host_id);
  END IF;
END $$;

-- 8. Create RLS policies for stays
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stays') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view available stays" ON stays;
    DROP POLICY IF EXISTS "Hosts can manage own stays" ON stays;
    
    -- Create policies based on available columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'status') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'is_available') THEN
      CREATE POLICY "Users can view available stays" ON stays
        FOR SELECT USING (status = 'active' AND is_available = true);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'is_available') THEN
      CREATE POLICY "Users can view available stays" ON stays
        FOR SELECT USING (is_available = true);
    ELSE
      CREATE POLICY "Users can view available stays" ON stays
        FOR SELECT USING (true); -- Allow all for now
    END IF;
    
    CREATE POLICY "Hosts can manage own stays" ON stays
      FOR ALL USING (auth.uid() = host_id);
  END IF;
END $$;

-- 9. Create indexes safely
DO $$
BEGIN
  -- Cars indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cars') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cars_host_id') THEN
      CREATE INDEX idx_cars_host_id ON cars(host_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'status') 
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cars_status') THEN
      CREATE INDEX idx_cars_status ON cars(status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'location')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cars_location') THEN
      CREATE INDEX idx_cars_location ON cars(location);
    END IF;
  END IF;

  -- Services indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
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
  END IF;

  -- Stays indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stays') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stays_host_id') THEN
      CREATE INDEX idx_stays_host_id ON stays(host_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'status') 
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stays_status') THEN
      CREATE INDEX idx_stays_status ON stays(status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'location')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stays_location') THEN
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
CREATE OR REPLACE FUNCTION validate_host_listing_permission(p_host_id UUID, p_listing_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_host_id 
    AND role = 'host' 
    AND p_listing_type = ANY(listing_types)
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

-- 12. Create triggers safely
DO $$
BEGIN
  -- Only create triggers for tables that exist and have updated_at column
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cars') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cars' AND column_name = 'updated_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_cars_updated_at') THEN
    CREATE TRIGGER update_cars_updated_at
      BEFORE UPDATE ON cars
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'updated_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_services_updated_at') THEN
    CREATE TRIGGER update_services_updated_at
      BEFORE UPDATE ON services
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stays') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stays' AND column_name = 'updated_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_stays_updated_at') THEN
    CREATE TRIGGER update_stays_updated_at
      BEFORE UPDATE ON stays
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
