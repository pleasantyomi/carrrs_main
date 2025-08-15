"use client"

import { useState, useEffect, use } from "react"
import { notFound } from "next/navigation"
import { StayBookingFlow } from "@/components/booking/stay-booking-flow"
import CarrrsLoader from "@/components/layout/loader"

interface StayPageProps {
  params: Promise<{
    id: string
  }>
}

export default function StayPage({ params }: StayPageProps) {
  const resolvedParams = use(params)
  const [stay, setStay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStay = async () => {
      try {
        const response = await fetch(`/api/stays/${resolvedParams.id}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            notFound()
          }
          throw new Error(data.error || "Failed to fetch stay")
        }

        setStay(data.stay)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStay()
  }, [resolvedParams.id])

  if (loading) {
    return <CarrrsLoader />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (!stay) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-11/12 mx-auto py-8">
        <StayBookingFlow stay={stay} />
      </div>
    </div>
  )
}
