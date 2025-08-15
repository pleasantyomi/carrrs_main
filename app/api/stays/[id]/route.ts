import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await context.params;
    const { data: stay, error } = await supabase.from("stays").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Stay not found" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ stay })
  } catch (error) {
    console.error("Stay fetch API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
