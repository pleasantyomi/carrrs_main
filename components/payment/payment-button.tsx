"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { generateTxRef, initializeFlutterwavePayment, formatAmount } from "@/lib/flutterwave"
import { useRouter } from "next/navigation"

interface PaymentButtonProps {
  amount: number
  bookingId: string
  userEmail: string
  userName: string
  userPhone: string
  bookingType: "car" | "experience" | "service" | "stay"
  onSuccess?: (response: any) => void
  onError?: (error: any) => void
}

export function PaymentButton({
  amount,
  bookingId,
  userEmail,
  userName,
  userPhone,
  bookingType,
  onSuccess,
  onError,
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      const txRef = generateTxRef()

      // Store payment record in database
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: bookingId,
          amount,
          tx_ref: txRef,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to initialize payment")
      }

      const paymentConfig = {
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
        tx_ref: txRef,
        amount,
        currency: "NGN",
        payment_options: "card,mobilemoney,ussd",
        customer: {
          email: userEmail,
          phone_number: userPhone,
          name: userName,
        },
        customizations: {
          title: "Carrrs Payment",
          description: `Payment for ${bookingType} booking`,
          logo: "/logo.png",
        },
        callback: async (response: any) => {
          setIsLoading(false)
          if (response.status === "successful") {
            // Verify payment on backend
            await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tx_ref: txRef,
                transaction_id: response.transaction_id,
              }),
            })

            onSuccess?.(response)
            router.push(`/payment/success?booking=${bookingId}`)
          } else {
            onError?.(response)
            router.push(`/payment/failed?booking=${bookingId}`)
          }
        },
        onclose: () => {
          setIsLoading(false)
        },
      }

      initializeFlutterwavePayment(paymentConfig)
    } catch (error) {
      setIsLoading(false)
      onError?.(error)
      console.error("Payment initialization failed:", error)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Pay ${formatAmount(amount)}`
      )}
    </Button>
  )
}
