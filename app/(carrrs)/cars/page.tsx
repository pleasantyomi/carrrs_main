import { PopularCars } from "@/components/carrrs/popular-cars"
import { CarsByLocation } from "@/components/carrrs/cars-by-location"
import { SearchBar } from "@/components/carrrs/search-bar"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin, Users, Fuel, Settings } from "lucide-react"
import Link from "next/link"

interface CarsPageProps {
  searchParams: Promise<{
    state?: string
  }>
}

async function getCarsForState(state?: string) {
  if (!state) return null

  try {
    const supabase = await createClient()
    
    // Try to query with rating first, fallback to created_at if rating column doesn't exist
    let { data: cars, error } = await supabase
      .from('cars')
      .select('*')
      .eq('is_available', true)
      .eq('state', state)
      .order('rating', { ascending: false, nullsFirst: false })

    // If rating column doesn't exist, try with created_at
    if (error && error.message?.includes('rating')) {
      const fallbackQuery = await supabase
        .from('cars')
        .select('*')
        .eq('is_available', true)
        .eq('state', state)
        .order('created_at', { ascending: false })
      
      cars = fallbackQuery.data
      error = fallbackQuery.error
    }

    if (error) {
      console.error("Supabase error:", error)
      return []
    }

    return cars || []
  } catch (err) {
    console.error("Failed to fetch cars for state:", err)
    return []
  }
}

export default async function CarsPage({ searchParams }: CarsPageProps) {
  const resolvedSearchParams = await searchParams
  const { state } = resolvedSearchParams
  const stateCars = await getCarsForState(state)

  // If showing cars for a specific state
  if (state && stateCars) {
    return (
      <main className="w-11/12 mx-auto py-8 px-4">
        <section className="mb-12">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-4xl font-bold">
              Cars in {state}
            </h1>
          </div>
          <p className="text-muted-foreground mb-6">
            {stateCars.length} car{stateCars.length !== 1 ? 's' : ''} available
          </p>
          <SearchBar />
        </section>

        {stateCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stateCars.map((car: any) => (
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
                      {car.requires_driver && (
                        <div className="absolute top-4 left-4 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                          Driver Included
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">{car.title}</h3>
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
                            {car.features.slice(0, 3).map((feature: string, index: number) => (
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
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No cars available in {state} at the moment.
            </p>
            <Link href="/cars" className="text-primary hover:underline mt-4 inline-block">
              Browse all cars
            </Link>
          </div>
        )}
      </main>
    )
  }

  // Default cars page showing all cars by state
  return (
    <main className="w-11/12 mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Find Your Perfect <span className="text-primary">Car</span>
          </h1>
          <p className="text-secondary-foreground text-lg mb-8 max-w-2xl mx-auto">
            Rent cars, book amazing stays, or access premium services - all in one platform
          </p>
          <SearchBar />
        </div>

      <CarsByLocation />
    </main>
  )
}
