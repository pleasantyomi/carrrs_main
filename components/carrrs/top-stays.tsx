import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin, Users, Bed } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getTopStays() {
  try {
    const supabase = await createClient()
    
    const { data: stays, error } = await supabase
      .from('stays')
      .select('*')
      .eq('status', 'active')
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(6)

    if (error) {
      console.error("Supabase error:", error)
      return []
    }

    return stays || []
  } catch (err) {
    console.error("Failed to fetch top stays:", err)
    return []
  }
}

export async function TopStays() {
  const stays = await getTopStays()
  
  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">Top-rated Stays</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stays.map((stay: any) => (
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
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{stay.title}</h3>
                  {stay.rating && (
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm text-muted-foreground">{stay.rating}</span>
                    </div>
                  )}
                  <div className="flex items-center text-muted-foreground mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{stay.location}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      <span>{stay.bedrooms || stay.room_count || 1} rooms</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{stay.max_guests || 2} guests</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">{stay.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
