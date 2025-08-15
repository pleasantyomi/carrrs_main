import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

async function getStays(state?: string) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('stays')
      .select('*')
      .order('rating', { ascending: false })
      .limit(6)

    if (state) {
      query = query.eq('state', state)
    }

    const { data: stays, error } = await query

    if (error) {
      console.error("Supabase error:", error)
      return []
    }

    return stays || []
  } catch (err) {
    console.error("Failed to fetch stays:", err)
    return []
  }
}

interface StaysListProps {
  state?: string
  title?: string
}

export async function StaysList({ state, title = "Popular Hotels" }: StaysListProps) {
  const stays = await getStays(state)
  
  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">{state ? `Stays in ${state}` : title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stays.map((stay: any) => (
          <Link key={stay.id} href={`/stays/${stay.id}`}>
            <Card className="bg-card border-border hover:scale-105 transition-transform cursor-pointer p-0">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={stay.images?.[0] || "/placeholder.svg"}
                    alt={stay.title}
                    className="w-full h-64 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-4 right-4 bg-black/70 text-primary font-bold px-2 py-1 rounded-full text-sm">
                    ₦{stay.price_per_night}/night
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{stay.title}</h3>
                  <div className="flex items-center mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm text-muted-foreground">{stay.rating}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stay.location}</p>
                  <p className="text-muted-foreground line-clamp-2 mt-2">{stay.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
