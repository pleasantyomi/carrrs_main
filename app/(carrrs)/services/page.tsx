import { ServicesList } from "@/components/carrrs/services-list"
import { ServicesByLocation } from "@/components/carrrs/services-by-location"
import { SearchBar } from "@/components/carrrs/search-bar"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin } from "lucide-react"
import Link from "next/link"

interface ServicesPageProps {
  searchParams: Promise<{
    state?: string
  }>
}

async function getServicesForState(state?: string) {
  if (!state) return null

  try {
    const supabase = await createClient()
    
    // Try to query with rating first, fallback to created_at if rating column doesn't exist
    let { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_available', true)
      .eq('state', state)
      .order('rating', { ascending: false, nullsFirst: false })

    // If rating column doesn't exist, try with created_at
    if (error && error.message?.includes('rating')) {
      const fallbackQuery = await supabase
        .from('services')
        .select('*')
        .eq('is_available', true)
        .eq('state', state)
        .order('created_at', { ascending: false })
      
      services = fallbackQuery.data
      error = fallbackQuery.error
    }

    if (error) {
      console.error("Supabase error:", error)
      return []
    }

    return services || []
  } catch (err) {
    console.error("Failed to fetch services for state:", err)
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

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const resolvedSearchParams = await searchParams
  const { state } = resolvedSearchParams
  const stateServices = await getServicesForState(state)

  // If showing services for a specific state
  if (state && stateServices) {
    return (
      <main className="w-11/12 mx-auto py-8 px-4">
        <section className="mb-12">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-4xl font-bold">
              Services in {state}
            </h1>
          </div>
          <p className="text-muted-foreground mb-6">
            {stateServices.length} service{stateServices.length !== 1 ? 's' : ''} available
          </p>
          <SearchBar />
        </section>

        {stateServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stateServices.map((service: any) => (
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
                      <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
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
                            {service.features.slice(0, 3).map((feature: string, index: number) => (
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
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No services available in {state} at the moment.
            </p>
            <Link href="/services" className="text-primary hover:underline mt-4 inline-block">
              Browse all services
            </Link>
          </div>
        )}
      </main>
    )
  }

  // Default services page showing all services by state
  return (
    <main className="w-11/12 mx-auto py-8 px-4">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-center">Find Your Perfect Service</h1>
        <SearchBar />
      </section>

      <ServicesByLocation />
    </main>
  )
}
