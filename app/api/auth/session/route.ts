import { createClient } from "@/lib/supabase/server"; // async helper
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();  // await here!
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 401 });
    }
    if (!session) {
      return NextResponse.json({ session: null, profile: null });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      session,
      profile,
      user: session.user,
    });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
