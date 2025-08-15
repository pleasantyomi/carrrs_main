import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tx_ref = searchParams.get("tx_ref")
    const transaction_id = searchParams.get("transaction_id")

    if (!tx_ref && !transaction_id) {
      return NextResponse.json(
        { error: "Missing transaction reference" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify transaction with Flutterwave
    const verifyUrl = transaction_id 
      ? `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`
      : `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`

    const response = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    if (!response.ok || result.status !== "success") {
      return NextResponse.json(
        { error: "Transaction verification failed" },
        { status: 400 }
      )
    }

    const transactionData = result.data

    // Update payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .update({
        status: transactionData.status,
        flutterwave_tx_id: transactionData.id,
        response_data: transactionData,
        updated_at: new Date().toISOString(),
      })
      .eq("flutterwave_tx_ref", transactionData.tx_ref)
      .select()
      .single()

    if (paymentError) {
      console.error("Error updating payment:", paymentError)
      return NextResponse.json(
        { error: "Failed to update payment record" },
        { status: 500 }
      )
    }

    // If payment is successful, update booking status
    if (transactionData.status === "successful") {
      await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", payment.booking_id)
    }

    return NextResponse.json({
      status: transactionData.status,
      payment,
      transaction: transactionData
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tx_ref, transaction_id } = await request.json()

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify payment with Flutterwave (in production, you'd make an API call to Flutterwave)
    // For now, we'll simulate successful verification
    const isVerified = true // This would be the result of Flutterwave verification

    if (isVerified) {
      // Update payment status
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          flutterwave_tx_id: transaction_id,
          status: "successful",
          updated_at: new Date().toISOString(),
        })
        .eq("flutterwave_tx_ref", tx_ref)

      if (paymentError) {
        console.error("Payment update error:", paymentError)
        return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
      }

      // Update booking status to confirmed
      const { data: payment } = await supabase
        .from("payments")
        .select("booking_id")
        .eq("flutterwave_tx_ref", tx_ref)
        .single()

      if (payment) {
        await supabase.from("bookings").update({ status: "confirmed" }).eq("id", payment.booking_id)
      }

      return NextResponse.json({ success: true })
    } else {
      // Update payment status to failed
      await supabase
        .from("payments")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("flutterwave_tx_ref", tx_ref)

      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
