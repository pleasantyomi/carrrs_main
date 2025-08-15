"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CustomPaymentUI } from "@/components/payment/custom-payment-ui"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import CarrrsLoader from "@/components/layout/loader"

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const booking_id = searchParams.get("booking_id")
  const amount = searchParams.get("amount")
  const type = searchParams.get("type")

  useEffect(() => {
    async function loadData() {
      if (!booking_id || !amount || !type) {
        router.push("/")
        return
      }

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push("/auth/login")
        return
      }

      setUser(session.user)

      // Fetch booking details
      const { data: bookingData, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", booking_id)
        .eq("user_id", session.user.id)
        .single()

      if (error || !bookingData) {
        router.push("/")
        return
      }

      setBooking(bookingData)
      setLoading(false)
    }

    loadData()
  }, [booking_id, amount, type, router])

  const handlePaymentSuccess = (response: any) => {
    // Redirect to success page
    router.push(`/payment/success?tx_ref=${response.tx_ref}`)
  }

  const handlePaymentError = (error: any) => {
    // Redirect to failure page
    router.push(`/payment/failed?error=${encodeURIComponent(error.message)}`)
  }

  if (loading) {
    return <CarrrsLoader />
  }

  if (!user || !booking || !booking_id || !amount || !type) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Complete Your Payment
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Secure payment powered by Flutterwave
          </p>
        </div>

        <CustomPaymentUI
          amount={parseFloat(amount)}
          bookingId={booking_id}
          userEmail={user.email || ""}
          userName={user.user_metadata?.full_name || ""}
          userPhone={user.user_metadata?.phone || ""}
          bookingType={type as "car" | "experience" | "service" | "stay"}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<CarrrsLoader />}>
      <PaymentContent />
    </Suspense>
  )
}
