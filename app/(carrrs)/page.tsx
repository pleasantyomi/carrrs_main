import { SearchBar } from "@/components/carrrs/search-bar"
import { CarsByLocation } from "@/components/carrrs/cars-by-location"
import { PopularCars } from "@/components/carrrs/popular-cars"

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <main className="w-11/12 mx-auto py-8">
        {/* Hero Section with Search */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Find Your Perfect <span className="text-primary">Stay</span>
          </h1>
          <p className="text-secondary-foreground text-lg mb-8 max-w-2xl mx-auto">
            Rent cars, book amazing stays, or access premium services - all in one platform
          </p>
          <SearchBar />
        </div>

        {/* Content Sections */}
        <div className="space-y-16">
          {/* <PopularCars /> */}
          <CarsByLocation />
        </div>
      </main>
    </div>
  )
}
