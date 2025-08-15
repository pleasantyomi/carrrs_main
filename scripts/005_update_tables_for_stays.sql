-- Alter services table to add state
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS state TEXT;

-- Alter cars table to add state
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS state TEXT;

-- Create stays table (for hotels)
CREATE TABLE IF NOT EXISTS stays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_per_night DECIMAL(10,2) NOT NULL,
  hotel_type TEXT CHECK (hotel_type IN ('hotel', 'apartment', 'villa', 'guest_house')),
  state TEXT NOT NULL,
  location TEXT NOT NULL,
  images TEXT[], -- Array of image URLs
  features TEXT[], -- Array of amenities
  room_count INTEGER,
  max_guests INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  rating DECIMAL(2,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for stays
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;

-- Create policies for stays
CREATE POLICY "Anyone can view available stays" ON stays
  FOR SELECT USING (is_available = true);

CREATE POLICY "Hosts can manage their stays" ON stays
  FOR ALL USING (auth.uid() = host_id);

-- Update bookings table to include stays
ALTER TABLE bookings
  ALTER COLUMN booking_type TYPE TEXT;

-- Drop the old constraint if it exists and add the new one
ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS bookings_booking_type_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_booking_type_check 
  CHECK (booking_type IN ('car', 'stay', 'service'));

-- Add stays column to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS stay_id UUID REFERENCES stays(id);

-- Add rating columns if they don't exist
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1);

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1);
                                        