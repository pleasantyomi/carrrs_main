"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Users, Clock, Star } from "lucide-react"
import { BookingDatePicker } from "./booking-date-picker"
import { PriceBreakdown } from "./price-breakdown"

interface Experience {
  id: string
  title: string
  description: string
  total_price: number
  location: string
  images: string[]
  duration_hours: number
  max_participants: number
  car: any
  services: any[]
}

interface ExperienceBookingFlowProps {
  experience: Experience
}

export function ExperienceBookingFlow({ experience }: ExperienceBookingFlowProps) {
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    guestCount: 1,
    specialRequests: "",
  })

  const [currentStep, setCurrentStep] = useState(1)

  const handleBooking = async () => {
    // TODO: Implement booking API call
    console.log("Experience booking data:", { ...bookingData, experienceId: experience.id })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Experience Details */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="relative">
              <img
                src={experience.images[0] || "/placeholder.svg"}
                alt={experience.title}
                className="w-full h-64 object-cover rounded-t-lg"
              />
              <div className="absolute top-4 right-4 bg-black/70 text-primary font-bold px-3 py-1 rounded-full">
                ₦{experience.total_price.toLocaleString()}
              </div>
            </div>
            <div className="p-6">
              <h1 className="text-3xl font-bold mb-2">{experience.title}</h1>
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                {experience.location}
              </div>
              <p className="text-muted-foreground mb-6">{experience.description}</p>

              {/* Experience Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm">{experience.duration_hours} hours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm">Up to {experience.max_participants} people</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm">Premium Experience</span>
                </div>
              </div>

              {/* Included Car */}
              {experience.car && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Included Vehicle</h3>
                  <div className="bg-secondary/20 rounded-lg p-4">
                    <h4 className="font-medium">{experience.car.title}</h4>
                    <p className="text-sm text-muted-foreground">{experience.car.description}</p>
                  </div>
                </div>
              )}

              {/* Included Services */}
              {experience.services && experience.services.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Included Services</h3>
                  <div className="space-y-3">
                    {experience.services.map((service, index) => (
                      <div key={index} className="bg-secondary/20 rounded-lg p-4">
                        <h4 className="font-medium">{service.title}</h4>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Form */}
      <div className="space-y-6">
        <Card className="bg-card border-border sticky top-24">
          <CardHeader>
            <CardTitle>Book This Experience</CardTitle>
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
                  <Label htmlFor="guests">Number of Participants</Label>
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    max={experience.max_participants}
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

                <PriceBreakdown
                  basePrice={experience.total_price}
                  days={1}
                  totalAmount={experience.total_price}
                  isExperience={true}
                />

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
                      <span>Experience:</span>
                      <span>{experience.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{bookingData.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{experience.duration_hours} hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Participants:</span>
                      <span>{bookingData.guestCount}</span>
                    </div>
                  </div>
                </div>

                <PriceBreakdown
                  basePrice={experience.total_price}
                  days={1}
                  totalAmount={experience.total_price}
                  isExperience={true}
                />

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
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full glow-on-hover"
                  >
                    Pay ₦{experience.total_price.toLocaleString()}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
