"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Users, Fuel, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { BookingDatePicker } from "./booking-date-picker"
import { PriceBreakdown } from "./price-breakdown"
import { supabase } from "@/lib/supabase/client"

interface CarType {
  id: string
  title: string
  description: string
  price_per_day: number
  brand: string
  model: string
  year: number
  seats: number
  transmission: string
  fuel_type: string
  location: string
  images: string[]
  features: string[]
  requires_driver: boolean
}

interface CarBookingFlowProps {
  car: CarType
}

export function CarBookingFlow({ car }: CarBookingFlowProps) {
  const router = useRouter()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    guestCount: 1,
    specialRequests: "",
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  
  useEffect(() => {
    async function checkAuthStatus() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setIsAuthenticated(true)
        setUser(session.user)
        
        // Check verification status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_verified')
          .eq('id', session.user.id)
          .single()

        setIsVerified(profile?.is_verified || false)
      }
    }

    checkAuthStatus()
  }, [])

  const handleAuthCheck = async () => {
    setAuthLoading(true)
    
    if (!isAuthenticated) {
      router.push('/auth/login')
      return false
    }

    if (!isVerified) {
      router.push('/dashboard/verification')
      return false
    }

    setAuthLoading(false)
    return true
  }

  const handleStartBooking = async () => {
    const canProceed = await handleAuthCheck()
    if (canProceed) {
      setCurrentStep(2) // Move to booking step
    }
  }

  const calculateDays = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0
    const start = new Date(bookingData.startDate)
    const end = new Date(bookingData.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const totalAmount = calculateDays() * car.price_per_day

  const handleBooking = async () => {
    const canProceed = await handleAuthCheck()
    if (!canProceed) return
    
    setIsCreatingBooking(true)
    
    try {
      // Create booking in database
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          car_id: car.id,
          start_date: bookingData.startDate,
          end_date: bookingData.endDate,
          guest_count: bookingData.guestCount,
          special_requests: bookingData.specialRequests,
          total_amount: totalAmount,
          booking_type: 'car'
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
      {/* Car Details */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {/* Main Image Display */}
            <div className="relative">
              <img
                src={car.images[selectedImageIndex] || "/placeholder.svg"}
                alt={`${car.title} - Image ${selectedImageIndex + 1}`}
                className="w-full h-64 object-cover rounded-t-lg"
              />
              <div className="absolute top-4 right-4 bg-black/70 text-primary font-bold px-3 py-1 rounded-full">
                ₦{car.price_per_day.toLocaleString()}/day
              </div>
              
              {/* Navigation Arrows for multiple images */}
              {car.images && car.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === 0 ? car.images.length - 1 : prev - 1
                    )}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === car.images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {selectedImageIndex + 1} / {car.images.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Image Thumbnails Grid */}
            {car.images && car.images.length > 1 && (
              <div className="p-4 border-b border-border">
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {car.images.map((image, index) => (
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
                        alt={`${car.title} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-2">{car.title}</h1>
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                {car.location}
              </div>
              <p className="text-muted-foreground mb-6">{car.description}</p>

              {/* Car Specifications */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm">{car.seats} seats</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="text-sm capitalize">{car.transmission}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Fuel className="h-4 w-4 text-primary" />
                  <span className="text-sm capitalize">{car.fuel_type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{car.year}</span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Features</h3>
                <div className="flex flex-wrap gap-2">
                  {car.features.map((feature, index) => (
                    <span key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {car.requires_driver && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                  <p className="text-primary font-medium">Driver Required</p>
                  <p className="text-sm text-muted-foreground">This car comes with a professional driver.</p>
                </div>
              )}

              {/* Authentication Notice */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-amber-800 dark:text-amber-200 font-medium text-sm">🔐 Verification Required</p>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                  Account verification is required to book cars for safety and security purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Form */}
      <div className="space-y-6">
        <Card className="bg-card border-border sticky top-24">
          <CardHeader>
            <CardTitle>Book This Car</CardTitle>
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
                  <Label htmlFor="guests">Number of Passengers</Label>
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    max={car.seats}
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

                <PriceBreakdown basePrice={car.price_per_day} days={calculateDays()} totalAmount={totalAmount} />

                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push('/auth/login')}
                      disabled={!bookingData.startDate || !bookingData.endDate}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full glow-on-hover"
                    >
                      Sign In to Book This Car
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Account verification required for car rentals
                    </p>
                  </div>
                ) : !isVerified ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push('/dashboard/verification')}
                      disabled={!bookingData.startDate || !bookingData.endDate}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-full"
                    >
                      Verify Account to Book
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Account verification is required for car rentals for safety and security
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleStartBooking}
                    disabled={!bookingData.startDate || !bookingData.endDate || authLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full glow-on-hover"
                  >
                    {authLoading ? "Checking..." : "Continue to Payment"}
                  </Button>
                )}
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Car:</span>
                      <span>{car.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dates:</span>
                      <span>
                        {bookingData.startDate} to {bookingData.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{calculateDays()} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passengers:</span>
                      <span>{bookingData.guestCount}</span>
                    </div>
                  </div>
                </div>

                <PriceBreakdown basePrice={car.price_per_day} days={calculateDays()} totalAmount={totalAmount} />

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
                      <span>Car:</span>
                      <span>{car.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{calculateDays()} days</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span>₦{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    const paymentUrl = `/payment/checkout?booking_id=${bookingId}&amount=${totalAmount}&type=car`
                    window.location.href = paymentUrl
                  }}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  Proceed to Payment - ₦{totalAmount.toLocaleString()}
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
