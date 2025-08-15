import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import Link from "next/link"

import { createClient } from "@/lib/supabase/server"

async function getPopularCars(state?: string) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('cars')
      .select('*')
      .order('rating', { ascending: false })
      .limit(6)

    if (state) {
      query = query.eq('state', state)
    }

    const { data: cars, error } = await query

    if (error) {
      console.error("Supabase error:", error)
      return []
    }

    return cars || []
  } catch (err) {
    console.error("Failed to fetch popular cars:", err)
    return []
  }
}

interface PopularCarsProps {
  state?: string
  title?: string
}

export async function PopularCars({ state, title = "Popular Cars" }: PopularCarsProps) {
  const cars = await getPopularCars(state)
  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">{state ? `Cars in ${state}` : title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car: any) => (
          <Link key={car.id} href={`/cars/${car.id}`}>
            <Card className="bg-card border-border hover:scale-105 transition-transform cursor-pointer p-0">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={car.image || "/placeholder.svg"}
                    alt={car.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                  {car.with_driver && (
                    <Badge className="absolute top-4 left-4 bg-green-600 text-white hover:bg-green-700">
                      With Driver
                    </Badge>
                  )}
                  <div className="absolute top-4 right-4 bg-black/70 text-primary font-bold px-2 py-1 rounded-full text-sm">
                    ₦{car.price_per_day}/day
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{car.title}</h3>
                  <div className="flex items-center mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-muted-foreground">{car.rating}</span>
                  </div>
                  <p className="text-muted-foreground">{car.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
