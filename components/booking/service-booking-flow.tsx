"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { BookingDatePicker } from "./booking-date-picker"
import { PriceBreakdown } from "./price-breakdown"
import { supabase } from "@/lib/supabase/client"

interface Service {
  id: string
  title: string
  description: string
  price: number
  service_type: string
  location: string
  images: string[]
  features: string[]
}

interface ServiceBookingFlowProps {
  service: Service
}

export function ServiceBookingFlow({ service }: ServiceBookingFlowProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    guestCount: 1,
    specialRequests: "",
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)

  useEffect(() => {
    async function getUserInfo() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    }
    getUserInfo()
  }, [])

  const handleBooking = async () => {
    setIsCreatingBooking(true)
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: service.id,
          start_date: bookingData.startDate,
          guest_count: bookingData.guestCount,
          special_requests: bookingData.specialRequests,
          total_amount: service.price,
          booking_type: 'service'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create booking')
      }

      const { booking } = await response.json()
      setBookingId(booking.id)
      setCurrentStep(3) // Move to payment step
      
    } catch (error) {
      console.error('Booking creation failed:', error)
      alert('Failed to create booking. Please try again.')
    } finally {
      setIsCreatingBooking(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Service Details */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {/* Main Image Display */}
            <div className="relative">
              <img
                src={service.images[selectedImageIndex] || "/placeholder.svg"}
                alt={`${service.title} - Image ${selectedImageIndex + 1}`}
                className="w-full h-64 object-cover rounded-t-lg"
              />
              <div className="absolute top-4 right-4 bg-black/70 text-primary font-bold px-3 py-1 rounded-full">
                From ₦{service.price.toLocaleString()}
              </div>
              
              {/* Navigation Arrows for multiple images */}
              {service.images && service.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === 0 ? service.images.length - 1 : prev - 1
                    )}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === service.images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {selectedImageIndex + 1} / {service.images.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Image Thumbnails Grid */}
            {service.images && service.images.length > 1 && (
              <div className="p-4 border-b border-border">
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {service.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${service.title} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-2">{service.title}</h1>
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                {service.location}
              </div>
              <p className="text-muted-foreground mb-6">{service.description}</p>

              {/* Service Type */}
              <div className="mb-6">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium capitalize">
                  {service.service_type.replace("_", " ")}
                </span>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">What's Included</h3>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature, index) => (
                    <span key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Form */}
      <div className="space-y-6">
        <Card className="bg-card border-border sticky top-24">
          <CardHeader>
            <CardTitle>Book This Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <>
                <BookingDatePicker
                  startDate={bookingData.startDate}
                  endDate={bookingData.endDate}
                  onDateChange={(startDate, endDate) => setBookingData({ ...bookingData, startDate, endDate })}
                />

                <div className="space-y-2">
                  <Label htmlFor="guests">Number of People</Label>
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    value={bookingData.guestCount}
                    onChange={(e) => setBookingData({ ...bookingData, guestCount: Number.parseInt(e.target.value) })}
                    className="bg-background border-border rounded-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requests">Special Requests (Optional)</Label>
                  <Textarea
                    id="requests"
                    placeholder="Any special requirements or requests..."
                    value={bookingData.specialRequests}
                    onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>

                <PriceBreakdown basePrice={service.price} days={1} totalAmount={service.price} isService={true} />

                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!bookingData.startDate}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full glow-on-hover"
                >
                  Continue to Payment
                </Button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span>{service.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{bookingData.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>People:</span>
                      <span>{bookingData.guestCount}</span>
                    </div>
                  </div>
                </div>

                <PriceBreakdown basePrice={service.price} days={1} totalAmount={service.price} isService={true} />

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border-border rounded-full"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleBooking}
                    disabled={isCreatingBooking}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full glow-on-hover"
                  >
                    {isCreatingBooking ? "Creating Booking..." : "Create Booking"}
                  </Button>
                </div>
              </>
            )}

            {currentStep === 3 && bookingId && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span>{service.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{bookingData.startDate}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span>₦{service.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    const paymentUrl = `/payment/checkout?booking_id=${bookingId}&amount=${service.price}&type=service`
                    window.location.href = paymentUrl
                  }}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  Proceed to Payment - ₦{service.price.toLocaleString()}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="w-full border-border rounded-full"
                >
                  Back to Summary
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
