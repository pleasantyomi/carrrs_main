import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      car_id, 
      service_id, 
      stay_id, 
      experience_id,
      start_date, 
      end_date, 
      guest_count, 
      special_requests, 
      total_amount, 
      booking_type 
    } = body

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create booking data based on type
    let bookingData: any = {
      user_id: user.id,
      status: "pending",
      total_amount,
      guest_count,
      special_requests,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add type-specific fields
    if (booking_type === 'car' && car_id) {
      bookingData.car_id = car_id
      bookingData.start_date = start_date
      bookingData.end_date = end_date
    } else if (booking_type === 'stay' && stay_id) {
      bookingData.stay_id = stay_id
      bookingData.start_date = start_date
      bookingData.end_date = end_date
    } else if (booking_type === 'service' && service_id) {
      bookingData.service_id = service_id
      bookingData.booking_date = start_date
    } else if (booking_type === 'experience' && experience_id) {
      bookingData.experience_id = experience_id
      bookingData.booking_date = start_date
    }

    // Insert booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert(bookingData)
      .select()
      .single()

    if (error) {
      console.error("Booking creation error:", error)
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Booking API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user bookings
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        cars(*),
        stays(*),
        services(*),
        experiences(*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Bookings fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
    }

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Bookings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
