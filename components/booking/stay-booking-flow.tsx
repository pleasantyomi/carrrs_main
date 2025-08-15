"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, Users, Bed, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Stay {
  id: string
  title: string
  price_per_night: number
  location: string
  state: string
  room_count: number
  max_guests: number
  hotel_type: string
  features: string[]
  images?: string[]
  description?: string
}

interface StayBookingFlowProps {
  stay: Stay
}

export function StayBookingFlow({ stay }: StayBookingFlowProps) {
  const [step, setStep] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)
  const [bookingData, setBookingData] = useState({
    checkInDate: "",
    checkOutDate: "",
    guests: 1,
    rooms: 1,
    specialRequests: "",
    customerInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    }
  })

  useEffect(() => {
    async function getUserInfo() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
      }
    }
    getUserInfo()
  }, [])

  const calculateNights = () => {
    if (!bookingData.checkInDate || !bookingData.checkOutDate) return 0
    const checkIn = new Date(bookingData.checkInDate)
    const checkOut = new Date(bookingData.checkOutDate)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const nights = calculateNights()
  const subtotal = stay.price_per_night * nights * bookingData.rooms
  const serviceFee = subtotal * 0.1 // 10% service fee
  const taxes = subtotal * 0.075 // 7.5% VAT
  const total = subtotal + serviceFee + taxes

  const updateBookingData = (field: string, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }))
  }

  const updateCustomerInfo = (field: string, value: string) => {
    setBookingData(prev => ({
      ...prev,
      customerInfo: { ...prev.customerInfo, [field]: value }
    }))
  }

  const handleBooking = async () => {
    setIsCreatingBooking(true)
    
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stay_id: stay.id,
          start_date: bookingData.checkInDate,
          end_date: bookingData.checkOutDate,
          guest_count: bookingData.guests,
          special_requests: bookingData.specialRequests,
          total_amount: total,
          booking_type: "stay"
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create booking")
      }

      const { booking } = await response.json()
      setBookingId(booking.id)
      setStep(3) // Move to payment step
      
    } catch (error) {
      console.error("Booking creation failed:", error)
      alert("Failed to create booking. Please try again.")
    } finally {
      setIsCreatingBooking(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Booking Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Stay Info Card */}
        <Card>
          <CardContent className="p-0">
            {/* Image Gallery */}
            {stay.images && stay.images.length > 0 && (
              <>
                {/* Main Image Display */}
                <div className="relative">
                  <img
                    src={stay.images[selectedImageIndex] || "/placeholder.svg"}
                    alt={`${stay.title} - Image ${selectedImageIndex + 1}`}
                    className="w-full h-64 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-4 right-4 bg-black/70 text-primary font-bold px-3 py-1 rounded-full">
                    ₦{stay.price_per_night.toLocaleString()}/night
                  </div>
                  
                  {/* Navigation Arrows for multiple images */}
                  {stay.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(prev => 
                          prev === 0 ? stay.images!.length - 1 : prev - 1
                        )}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(prev => 
                          prev === stay.images!.length - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
                        {selectedImageIndex + 1} / {stay.images.length}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Image Thumbnails Grid */}
                {stay.images.length > 1 && (
                  <div className="p-4 border-b border-border">
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {stay.images.map((image, index) => (
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
                            alt={`${stay.title} thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              {stay.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {stay.location}, {stay.state}
            </div>
            {stay.description && (
              <p className="text-muted-foreground mt-2">{stay.description}</p>
            )}
          </CardHeader>
        </Card>

        {/* Step 1: Dates and Guests */}
        {step >= 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Select Dates & Guests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkIn">Check-in Date</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={bookingData.checkInDate}
                    onChange={(e) => updateBookingData("checkInDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="checkOut">Check-out Date</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={bookingData.checkOutDate}
                    onChange={(e) => updateBookingData("checkOutDate", e.target.value)}
                    min={bookingData.checkInDate || new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guests">Number of Guests</Label>
                  <Select
                    value={bookingData.guests.toString()}
                    onValueChange={(value) => updateBookingData("guests", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: stay.max_guests }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} Guest{i + 1 > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rooms">Number of Rooms</Label>
                  <Select
                    value={bookingData.rooms.toString()}
                    onValueChange={(value) => updateBookingData("rooms", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: stay.room_count }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} Room{i + 1 > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="requests">Special Requests (Optional)</Label>
                <Textarea
                  id="requests"
                  placeholder="Early check-in, late check-out, accessibility needs, etc."
                  value={bookingData.specialRequests}
                  onChange={(e) => updateBookingData("specialRequests", e.target.value)}
                />
              </div>

              {step === 1 && (
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!bookingData.checkInDate || !bookingData.checkOutDate}
                  className="w-full"
                >
                  Continue to Guest Information
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Guest Information */}
        {step >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Guest Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={bookingData.customerInfo.firstName}
                    onChange={(e) => updateCustomerInfo("firstName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={bookingData.customerInfo.lastName}
                    onChange={(e) => updateCustomerInfo("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingData.customerInfo.email}
                  onChange={(e) => updateCustomerInfo("email", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={bookingData.customerInfo.phone}
                  onChange={(e) => updateCustomerInfo("phone", e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-4">
                {step === 2 && (
                  <>
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={handleBooking}
                      disabled={!bookingData.customerInfo.firstName || !bookingData.customerInfo.lastName || !bookingData.customerInfo.email || isCreatingBooking}
                      className="flex-1"
                    >
                      {isCreatingBooking ? "Creating Booking..." : "Create Booking"}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment */}
        {step === 3 && bookingId && (
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Stay:</span>
                    <span>{stay.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dates:</span>
                    <span>
                      {new Date(bookingData.checkInDate).toLocaleDateString()} - {new Date(bookingData.checkOutDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{nights} night{nights !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guests:</span>
                    <span>{bookingData.guests}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>₦{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  const paymentUrl = `/payment/checkout?booking_id=${bookingId}&amount=${total}&type=stay`
                  window.location.href = paymentUrl
                }}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                Proceed to Payment - ₦{total.toLocaleString()}
              </Button>

              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="w-full border-border rounded-full"
              >
                Back to Guest Information
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Price Summary */}
      <div className="lg:col-span-1">
        <div className="space-y-3 p-4 bg-secondary/20 rounded-lg sticky top-4">
          <h3 className="font-semibold">Price Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>
                ₦{stay.price_per_night.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''} × {bookingData.rooms} room{bookingData.rooms !== 1 ? 's' : ''}
              </span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee (10%)</span>
              <span>₦{serviceFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes (7.5%)</span>
              <span>₦{taxes.toLocaleString()}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
          </div>
          
          {nights > 0 && (
            <div className="mt-4 p-3 bg-primary/10 rounded text-sm">
              <p className="font-medium">Stay Summary:</p>
              <p>{nights} night{nights !== 1 ? 's' : ''} • {bookingData.guests} guest{bookingData.guests !== 1 ? 's' : ''} • {bookingData.rooms} room{bookingData.rooms !== 1 ? 's' : ''}</p>
              <p className="text-muted-foreground">
                {bookingData.checkInDate && new Date(bookingData.checkInDate).toLocaleDateString()} - {bookingData.checkOutDate && new Date(bookingData.checkOutDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
