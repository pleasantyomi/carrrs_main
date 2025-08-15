import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get popular cars (limit 6)
    const { data: cars, error: carsError } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6)

    // Get top experiences (limit 6)
    const { data: experiences, error: experiencesError } = await supabase
      .from("experiences")
      .select(`
        *,
        car:cars(*),
        services:services(*)
      `)
      .order("created_at", { ascending: false })
      .limit(6)

    // Get available services (limit 6)
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6)

    if (carsError || experiencesError || servicesError) {
      const error = carsError || experiencesError || servicesError
      return NextResponse.json({ error: error?.message }, { status: 500 })
    }

    return NextResponse.json({
      cars: cars || [],
      experiences: experiences || [],
      services: services || [],
    })
  } catch (error) {
    console.error("Homepage listings API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
