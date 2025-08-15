// app/api/cars/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 10);
    const offset = Number(searchParams.get("offset") || 0);
    const hostId = searchParams.get("host_id");

    const supabase = await createClient();

    let query = supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (hostId) {
      query = query.eq("host_id", hostId);
    }

    const { data: cars, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cars: cars || [] });
  } catch (error) {
    console.error("Cars fetch API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
