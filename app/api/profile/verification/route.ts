import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { driver_license_front, driver_license_back } = body

    // Validate required fields
    if (!driver_license_front || !driver_license_back) {
      return NextResponse.json(
        { error: "Both front and back images of driver's license are required" }, 
        { status: 400 }
      )
    }

    // Update the profile with license images
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        driver_license_front,
        driver_license_back,
        driver_license_verified: false, // Will be verified by admin
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Driver's license submitted successfully for verification",
      success: true 
    })
  } catch (error) {
    console.error("Profile verification API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
