import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "10"
    const offset = searchParams.get("offset") || "0"
    const hostId = searchParams.get("host_id")

    const supabase = await createClient()

    let query = supabase
      .from("services")
      .select("*")
      .range(Number.parseInt(offset), Number.parseInt(offset) + Number.parseInt(limit) - 1)
      .order("created_at", { ascending: false })

    if (hostId) {
      query = query.eq("host_id", hostId)
    }

    const { data: services, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ services })
  } catch (error) {
    console.error("Services fetch API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
