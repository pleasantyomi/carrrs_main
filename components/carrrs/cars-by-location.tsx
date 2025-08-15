import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, Users, Car, Fuel, Settings } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

interface Car {
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
  state: string
  images: string[]
  features: string[]
  rating?: number
  image?: string
  requires_driver: boolean
  with_driver?: boolean
}interface LocationGroup {
  state: string
  cars: Car[]
}

async function getCarsByState() {
  try {
    const supabase = await createClient()
    
    // Try to query with rating first, fallback to created_at if rating column doesn't exist
    let { data: cars, error } = await supabase
      .from('cars')
      .select('*')
      .eq('is_available', true)
      .order('rating', { ascending: false, nullsFirst: false })

    // If rating column doesn't exist, try with created_at
    if (error && error.message?.includes('rating')) {
      const fallbackQuery = await supabase
        .from('cars')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
      
      cars = fallbackQuery.data
      error = fallbackQuery.error
    }

    if (error) {
      console.error("Supabase error:", error)
      return []
    }

    // Group cars by state and limit to 3 per state
    const stateGroups: { [key: string]: LocationGroup } = {}
    
    cars?.forEach((car: Car) => {
      const state = car.state || 'Unknown'
      if (!stateGroups[state]) {
        stateGroups[state] = {
          state: state,
          cars: []
        }
      }
      
      // Only add up to 3 cars per state
      if (stateGroups[state].cars.length < 3) {
        stateGroups[state].cars.push(car)
      }
    })

    return Object.values(stateGroups).filter(group => group.cars.length > 0)
  } catch (err) {
    console.error("Failed to fetch cars by state:", err)
    return []
  }
}

export async function CarsByLocation() {
  const stateGroups = await getCarsByState()

  if (stateGroups.length === 0) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-8">Cars by State</h2>
        <p className="text-muted-foreground">No cars available at the moment.</p>
      </section>
    )
  }

  return (
    <section>
      {/* <h2 className="text-3xl font-bold mb-8">Cars by State</h2> */}
      <div className="space-y-12">
        {stateGroups.map((group) => (
          <div key={group.state} className="space-y-6">
            {/* State Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-2xl font-semibold">
                  Cars in {group.state}
                </h3>
              </div>
              <Link href={`/cars?state=${encodeURIComponent(group.state)}`}>
                <Button variant="outline" size="sm">
                  View All Cars in {group.state}
                </Button>
              </Link>
            </div>

            {/* Cars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.cars.map((car) => (
                <Link key={car.id} href={`/cars/${car.id}`}>
                  <Card className="bg-card border-border hover:scale-105 transition-transform cursor-pointer p-0">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={car.images?.[0] || car.image || "/placeholder.svg"}
                          alt={car.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute top-4 right-4 bg-black/70 text-primary font-bold px-2 py-1 rounded-full text-sm">
                          ₦{car.price_per_day?.toLocaleString()}/day
                        </div>
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          {car.year} {car.brand}
                        </div>
                        {(car.requires_driver || car.with_driver) && (
                          <Badge className="absolute top-4 left-4 bg-green-600 text-white hover:bg-green-700">
                            With Driver
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="text-xl font-semibold mb-2">{car.title}</h4>
                        {car.rating && (
                          <div className="flex items-center mb-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-muted-foreground">{car.rating}</span>
                          </div>
                        )}
                        <p className="text-muted-foreground text-sm mb-2">
                          📍 {car.location}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{car.seats} seats</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Settings className="h-4 w-4" />
                            <span>{car.transmission}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Fuel className="h-4 w-4" />
                            <span>{car.fuel_type}</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {car.description}
                        </p>
                        {car.features && car.features.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {car.features.slice(0, 3).map((feature, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                                >
                                  {feature}
                                </span>
                              ))}
                              {car.features.length > 3 && (
                                <span className="inline-block text-xs text-muted-foreground px-2 py-1">
                                  +{car.features.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
