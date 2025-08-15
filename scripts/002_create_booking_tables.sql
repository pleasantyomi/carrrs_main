-- Create cars table
CREATE TABLE IF NOT EXISTS cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_per_day DECIMAL(10,2) NOT NULL,
  brand TEXT,
  model TEXT,
  year INTEGER,
  seats INTEGER,
  transmission TEXT CHECK (transmission IN ('manual', 'automatic')),
  fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid')),
  location TEXT,
  images TEXT[], -- Array of image URLs
  features TEXT[], -- Array of features
  is_available BOOLEAN DEFAULT TRUE,
  requires_driver BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  service_type TEXT CHECK (service_type IN ('hotel', 'catering', 'souvenirs', 'tent_decorations')),
  location TEXT,
  images TEXT[],
  features TEXT[],
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create experiences table (combinations of cars + services)
CREATE TABLE IF NOT EXISTS experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  car_id UUID REFERENCES cars(id),
  service_ids UUID[], -- Array of service IDs
  location TEXT,
  images TEXT[],
  duration_hours INTEGER,
  max_participants INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  booking_type TEXT CHECK (booking_type IN ('car', 'experience', 'service')),
  car_id UUID REFERENCES cars(id),
  experience_id UUID REFERENCES experiences(id),
  service_id UUID REFERENCES services(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference TEXT,
  guest_count INTEGER DEFAULT 1,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create availability table for tracking bookings
CREATE TABLE IF NOT EXISTS availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_type TEXT CHECK (resource_type IN ('car', 'experience', 'service')),
  resource_id UUID NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource_type, resource_id, date)
);

-- Enable Row Level Security
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Cars policies
CREATE POLICY "Anyone can view available cars" ON cars
  FOR SELECT USING (is_available = true);

CREATE POLICY "Hosts can manage their cars" ON cars
  FOR ALL USING (auth.uid() = host_id);

-- Services policies
CREATE POLICY "Anyone can view available services" ON services
  FOR SELECT USING (is_available = true);

CREATE POLICY "Hosts can manage their services" ON services
  FOR ALL USING (auth.uid() = host_id);

-- Experiences policies
CREATE POLICY "Anyone can view available experiences" ON experiences
  FOR SELECT USING (is_available = true);

CREATE POLICY "Hosts can manage their experiences" ON experiences
  FOR ALL USING (auth.uid() = host_id);

-- Bookings policies
CREATE POLICY "Users can view their bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Availability policies
CREATE POLICY "Anyone can view availability" ON availability
  FOR SELECT TO authenticated;

CREATE POLICY "System can manage availability" ON availability
  FOR ALL TO authenticated;
