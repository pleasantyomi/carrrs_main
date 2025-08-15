import { Suspense } from "react"
import { CheckCircle, ArrowRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import CarrrsLoader from "@/components/layout/loader"

function PaymentSuccessContent() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-gray-400">
              Your booking has been confirmed. You'll receive a confirmation email shortly.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/dashboard/bookings">
              <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                View My Bookings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link href="/">
              <Button
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<CarrrsLoader />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
