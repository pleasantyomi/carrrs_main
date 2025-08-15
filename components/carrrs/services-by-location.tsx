import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Users, Calendar, Sparkles } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

interface Service {
  id: string
  title: string
  description: string
  price: number
  service_type: string
  state: string
  location: string
  images: string[]
  features: string[]
  rating?: number
}

interface StateGroup {
  state: string
  services: Service[]
}

async function getServicesByState() {
  try {
    const supabase = await createClient()
    
    // Try to query with rating first, fallback to created_at if rating column doesn't exist
    let { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_available', true)
      .order('rating', { ascending: false, nullsFirst: false })

    // If rating column doesn't exist, try with created_at
    if (error && error.message?.includes('rating')) {
      const fallbackQuery = await supabase
        .from('services')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
      
      services = fallbackQuery.data
      error = fallbackQuery.error
    }

    if (error) {
      console.error("Supabase error:", error)
      return []
    }

    // Group services by state and limit to 3 per state
    const stateGroups: { [key: string]: StateGroup } = {}
    
    services?.forEach((service: Service) => {
      const state = service.state || 'Unknown'
      if (!stateGroups[state]) {
        stateGroups[state] = {
          state: state,
          services: []
        }
      }
      
      // Only add up to 3 services per state
      if (stateGroups[state].services.length < 3) {
        stateGroups[state].services.push(service)
      }
    })

    return Object.values(stateGroups).filter(group => group.services.length > 0)
  } catch (err) {
    console.error("Failed to fetch services by state:", err)
    return []
  }
}

const getServiceTypeIcon = (serviceType: string) => {
  switch (serviceType) {
    case 'hotel':
      return '🏨'
    case 'catering':
      return '🍽️'
    case 'souvenirs':
      return '🎁'
    case 'tent_decorations':
      return '🎪'
    default:
      return '⭐'
  }
}

const getServiceTypeLabel = (serviceType: string) => {
  switch (serviceType) {
    case 'hotel':
      return 'Hotel Booking'
    case 'catering':
      return 'Catering'
    case 'souvenirs':
      return 'Souvenirs'
    case 'tent_decorations':
      return 'Event Decorations'
    default:
      return 'Service'
  }
}

export async function ServicesByLocation() {
  const stateGroups = await getServicesByState()

  if (stateGroups.length === 0) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-8">Services by State</h2>
        <p className="text-muted-foreground">No services available at the moment.</p>
      </section>
    )
  }

  return (
    <section>
      {/* <h2 className="text-3xl font-bold mb-8">Services by State</h2> */}
      <div className="space-y-12">
        {stateGroups.map((group) => (
          <div key={group.state} className="space-y-6">
            {/* State Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-2xl font-semibold">
                  {group.state}
                </h3>
              </div>
              <Link href={`/services?state=${encodeURIComponent(group.state)}`}>
                <Button variant="outline" size="sm">
                  View All Services in {group.state}
                </Button>
              </Link>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.services.map((service) => (
                <Link key={service.id} href={`/services/${service.id}`}>
                  <Card className="bg-card border-border hover:scale-105 transition-transform cursor-pointer p-0">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={service.images?.[0] || "/placeholder.svg"}
                          alt={service.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute top-4 right-4 bg-black/70 text-primary font-bold px-2 py-1 rounded-full text-sm">
                          ₦{service.price?.toLocaleString()}
                        </div>
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                          <span>{getServiceTypeIcon(service.service_type)}</span>
                          <span>{getServiceTypeLabel(service.service_type)}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-xl font-semibold mb-2">{service.title}</h4>
                        {service.rating && (
                          <div className="flex items-center mb-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-muted-foreground">{service.rating}</span>
                          </div>
                        )}
                        <p className="text-muted-foreground text-sm mb-2">
                          📍 {service.location}
                        </p>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                          {service.description}
                        </p>
                        {service.features && service.features.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {service.features.slice(0, 3).map((feature, index) => (
                                <span
                                  key={index}
                                  className="inline-block bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                                >
                                  {feature}
                                </span>
                              ))}
                              {service.features.length > 3 && (
                                <span className="inline-block text-xs text-muted-foreground px-2 py-1">
                                  +{service.features.length - 3} more
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
