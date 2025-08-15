import { Card, CardContent } from "@/components/ui/card"
import { Hotel, Utensils, Gift, Tent } from "lucide-react"
import Link from "next/link"

const mockServices = [
  {
    id: 1,
    title: "Hotel Booking",
    price: 15000,
    description: "Premium hotel reservations across Lagos",
    icon: Hotel,
    available: "Available today",
    image: "/placeholder.svg",
  },
  {
    id: 2,
    title: "Catering Services",
    price: 5000,
    description: "Professional catering for events and parties",
    icon: Utensils,
    available: "Available today",
    image: "/placeholder.svg",
  },
  {
    id: 3,
    title: "Souvenirs & Gifts",
    price: 2500,
    description: "Authentic Nigerian souvenirs and custom gifts",
    icon: Gift,
    available: "Available today",
    image: "/placeholder.svg",
  },
  {
    id: 4,
    title: "Tent Decorations",
    price: 25000,
    description: "Beautiful tent setups for weddings and events",
    icon: Tent,
    available: "Available today",
    image: "/placeholder.svg",
  },
]

export function AvailableServices() {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-8">Available Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockServices.map((service) => {
          const IconComponent = service.icon
          return (
            <Link key={service.id} href={`/services/${service.id}`}>
              <Card className="bg-card border-border hover:scale-105 transition-transform cursor-pointer p-0">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={service.image || "/placeholder.svg"}
                      alt={service.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute top-4 right-4 bg-black/70 text-primary font-bold px-2 py-1 rounded-full text-sm">
                      From ₦{service.price.toLocaleString()}
                    </div>
                    <div className="absolute top-4 left-4 bg-primary/90 text-white p-2 rounded-full">
                      <IconComponent className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{service.description}</p>
                    <p className="text-primary text-xs font-medium">{service.available}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
