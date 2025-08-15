import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { booking_id, amount, tx_ref } = await request.json()

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create payment record
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        booking_id,
        user_id: user.id,
        amount,
        flutterwave_tx_ref: tx_ref,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Payment initialization error:", error)
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error("Payment initialization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
