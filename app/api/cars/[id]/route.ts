import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await context.params;
    const { data: car, error } = await supabase.from("cars").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Car not found" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ car })
  } catch (error) {
    console.error("Car fetch API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
