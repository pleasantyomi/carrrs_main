import { StaysList } from "@/components/carrrs/stays-list"
import { StaysByLocation } from "@/components/carrrs/stays-by-location"
import { SearchBar } from "@/components/carrrs/search-bar"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin } from "lucide-react"
import Link from "next/link"

interface StaysPageProps {
  searchParams: Promise<{
    state?: string
  }>
}

async function getStaysForState(state?: string) {
  if (!state) return null

  try {
    const supabase = await createClient()
    
    // Try to query with rating first, fallback to created_at if rating column doesn't exist
    let { data: stays, error } = await supabase
      .from('stays')
      .select('*')
      .eq('is_available', true)
      .eq('state', state)
      .order('rating', { ascending: false, nullsFirst: false })

    // If rating column doesn't exist, try with created_at
    if (error && error.message?.includes('rating')) {
      const fallbackQuery = await supabase
        .from('stays')
        .select('*')
        .eq('is_available', true)
        .eq('state', state)
        .order('created_at', { ascending: false })
      
      stays = fallbackQuery.data
      error = fallbackQuery.error
    }

    if (error) {
      console.error("Supabase error:", error)
      return []
    }

    return stays || []
  } catch (err) {
    console.error("Failed to fetch stays for state:", err)
    return []
  }
}

export default async function StaysPage({ searchParams }: StaysPageProps) {
  const resolvedSearchParams = await searchParams
  const { state } = resolvedSearchParams
  const stateStays = await getStaysForState(state)

  // If showing stays for a specific state
  if (state && stateStays) {
    return (
      <main className="w-11/12 mx-auto py-8 px-4">
        <section className="mb-12">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-4xl font-bold">
              Stays in {state}
            </h1>
          </div>
          <p className="text-muted-foreground mb-6">
            {stateStays.length} stay{stateStays.length !== 1 ? 's' : ''} available
          </p>
          <SearchBar />
        </section>

        {stateStays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stateStays.map((stay: any) => (
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
                      <h3 className="text-xl font-semibold mb-2">{stay.title}</h3>
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
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No stays available in {state} at the moment.
            </p>
            <Link href="/stays" className="text-primary hover:underline mt-4 inline-block">
              Browse all stays
            </Link>
          </div>
        )}
      </main>
    )
  }

  // Default stays page showing all stays by state
  return (
    <main className="w-11/12 mx-auto py-8 px-4">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-center">Find Your Perfect Stay</h1>
        <SearchBar />
      </section>

      <StaysByLocation />
    </main>
  )
}
