"use client"

import { useState, useEffect, use } from "react"
import { notFound } from "next/navigation"
import { ServiceBookingFlow } from "@/components/booking/service-booking-flow"
import CarrrsLoader from "@/components/layout/loader"

interface ServicePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ServicePage({ params }: ServicePageProps) {
  const resolvedParams = use(params)
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${resolvedParams.id}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            notFound()
          }
          throw new Error(data.error || "Failed to fetch service")
        }

        setService(data.service)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchService()
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

  if (!service) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <ServiceBookingFlow service={service} />
      </div>
    </div>
  )
}
