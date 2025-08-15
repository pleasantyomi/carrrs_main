"use client"

import { useState, useEffect, use } from "react"
import { notFound } from "next/navigation"
import { CarBookingFlow } from "@/components/booking/car-booking-flow"
import CarrrsLoader from "@/components/layout/loader"

interface CarPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CarPage({ params }: CarPageProps) {
  const resolvedParams = use(params)
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const response = await fetch(`/api/cars/${resolvedParams.id}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            notFound()
          }
          throw new Error(data.error || "Failed to fetch car")
        }

        setCar(data.car)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCar()
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

  if (!car) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-11/12 mx-auto py-8">
        <CarBookingFlow car={car} />
      </div>
    </div>
  )
}
