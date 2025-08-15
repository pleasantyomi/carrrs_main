import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MapPin } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

interface Stay {
  id: string
  title: string
  description: string
  price_per_night: number
  hotel_type: string
  state: string
  location: string
  images: string[]
  rating?: number
  room_count: number
  max_guests: number
}

interface StateGroup {
  state: string
  stays: Stay[]
}

async function getStaysByState() {
  try {
    const supabase = await createClient()
    
    // Try to query with rating first, fallback to created_at if rating column doesn't exist
    let { data: stays, error } = await supabase
      .from('stays')
      .select('*')
      .eq('is_available', true)
      .order('rating', { ascending: false, nullsFirst: false })

    // If rating column doesn't exist, try with created_at
    if (error && error.message?.includes('rating')) {
      const fallbackQuery = await supabase
        .from('stays')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
      
      stays = fallbackQuery.data
      error = fallbackQuery.error
    }

    if (error) {
      console.error("Supabase error:", error)
      return []
    }

    // Group stays by state and limit to 3 per state
    const stateGroups: { [key: string]: StateGroup } = {}
    
    stays?.forEach((stay: Stay) => {
      const state = stay.state || 'Unknown'
      if (!stateGroups[state]) {
        stateGroups[state] = {
          state: state,
          stays: []
        }
      }
      
      // Only add up to 3 stays per state
      if (stateGroups[state].stays.length < 3) {
        stateGroups[state].stays.push(stay)
      }
    })

    return Object.values(stateGroups).filter(group => group.stays.length > 0)
  } catch (err) {
    console.error("Failed to fetch stays by state:", err)
    return []
  }
}

export async function StaysByLocation() {
  const stateGroups = await getStaysByState()

  if (stateGroups.length === 0) {
    return (
      <section>
        <h2 className="text-3xl font-bold mb-8">Stays by State</h2>
        <p className="text-muted-foreground">No stays available at the moment.</p>
      </section>
    )
  }

  return (
    <section>
      {/* <h2 className="text-3xl font-bold mb-8">Stays by State</h2> */}
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
              <Link href={`/stays?state=${encodeURIComponent(group.state)}`}>
                <Button variant="outline" size="sm">
                  View All Stays in {group.state}
                </Button>
              </Link>
            </div>

            {/* Stays Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.stays.map((stay) => (
                <Link key={stay.id} href={`/stays/${stay.id}`}>
                  <Card className="bg-card border-border hover:scale-105 transition-transform cursor-pointer p-0">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={stay.images?.[0] || "/placeholder.svg"}
                          alt={stay.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute top-4 right-4 bg-black/70 text-primary font-bold px-2 py-1 rounded-full text-sm">
                          ₦{stay.price_per_night?.toLocaleString()}/night
                        </div>
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          {stay.hotel_type}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-xl font-semibold mb-2">{stay.title}</h4>
                        {stay.rating && (
                          <div className="flex items-center mb-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-muted-foreground">{stay.rating}</span>
                          </div>
                        )}
                        <p className="text-muted-foreground text-sm mb-2">
                          📍 {stay.location}
                        </p>
                        <p className="text-muted-foreground text-sm mb-2">
                          🛏️ {stay.room_count} room{stay.room_count !== 1 ? 's' : ''} • 👥 Up to {stay.max_guests} guests
                        </p>
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {stay.description}
                        </p>
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
