import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const paymentData = await request.json()
    const { tx_ref, amount, currency, customer, type } = paymentData

    if (!tx_ref || !amount || !customer) {
      return NextResponse.json(
        { error: "Missing required payment data" },
        { status: 400 }
      )
    }

    // Prepare Flutterwave API payload
    const flutterwavePayload = {
      tx_ref,
      amount,
      currency: currency || "NGN",
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`,
      customer,
      customizations: paymentData.customizations,
      ...getPaymentMethodData(type, paymentData)
    }

    // Call Flutterwave API
    const response = await fetch("https://api.flutterwave.com/v3/charges", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flutterwavePayload),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Flutterwave API error:", result)
      return NextResponse.json(
        { error: result.message || "Payment processing failed" },
        { status: 400 }
      )
    }

    // Update payment record with Flutterwave response
    await supabase
      .from("payments")
      .update({
        flutterwave_id: result.data?.id,
        status: result.data?.status || "pending",
        response_data: result.data,
        updated_at: new Date().toISOString(),
      })
      .eq("tx_ref", tx_ref)

    // Handle different response types
    if (result.data?.status === "successful") {
      // Payment completed immediately
      return NextResponse.json({
        status: "successful",
        data: result.data,
        message: "Payment completed successfully"
      })
    } else if (result.data?.status === "pending") {
      // Payment pending (e.g., bank transfer, USSD)
      return NextResponse.json({
        status: "pending",
        data: result.data,
        message: getPaymentInstructions(type, result.data)
      })
    } else {
      // Payment failed or requires additional action
      return NextResponse.json({
        status: result.data?.status || "failed",
        data: result.data,
        message: result.message || "Payment failed"
      })
    }

  } catch (error) {
    console.error("Payment processing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function getPaymentMethodData(type: string, paymentData: any) {
  switch (type) {
    case "card":
      return {
        type: "card",
        card: {
          card_number: paymentData.card.card_number,
          cvv: paymentData.card.cvv,
          expiry_month: paymentData.card.expiry_month,
          expiry_year: paymentData.card.expiry_year,
          pin: paymentData.card.pin
        }
      }

    case "bank_transfer":
      return {
        type: "bank_transfer",
        bank: {
          code: paymentData.bank.code,
          account_number: paymentData.bank.account_number
        }
      }

    case "ussd":
      return {
        type: "ussd",
        ussd: {
          code: paymentData.ussd.code
        }
      }

    case "mobile_money_nigeria":
      return {
        type: "mobile_money_nigeria",
        mobile_money: {
          phone: paymentData.mobile_money.phone,
          network: paymentData.mobile_money.network,
          voucher: paymentData.mobile_money.voucher
        }
      }

    default:
      return {}
  }
}

function getPaymentInstructions(type: string, data: any): string {
  switch (type) {
    case "bank_transfer":
      return `Transfer ₦${data.amount} to Account: ${data.account_number}, Bank: ${data.bank_name}. Reference: ${data.tx_ref}`
    
    case "ussd":
      return `Dial ${data.ussd_code} on your phone and follow the prompts to complete payment.`
    
    case "mobile_money_nigeria":
      return `You will receive an SMS with payment instructions shortly.`
    
    default:
      return "Please complete the payment as instructed."
  }
}
