import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params

    const { data: service, error } = await supabase.from("services").select("*").eq("id", resolvedParams.id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Service not found" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error("Service fetch API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
