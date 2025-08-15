"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Calendar, Users } from "lucide-react"

export function SearchBar() {
  const [searchData, setSearchData] = useState({
    location: "",
    pickupDate: "",
    dropoffDate: "",
    passengers: "1",
  })

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Search data:", searchData)
  }

  return (
    <div className="bg-card rounded-full p-2 max-w-4xl mx-auto shadow-lg border border-border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {/* Location */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Where"
            value={searchData.location}
            onChange={(e) => setSearchData({ ...searchData, location: e.target.value })}
            className="pl-10 bg-transparent border-none rounded-full text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Pickup Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="date"
            placeholder="Pickup Date"
            value={searchData.pickupDate}
            onChange={(e) => setSearchData({ ...searchData, pickupDate: e.target.value })}
            className="pl-10 bg-transparent border-none rounded-full text-foreground focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Drop-off Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="date"
            placeholder="Drop-off Date"
            value={searchData.dropoffDate}
            onChange={(e) => setSearchData({ ...searchData, dropoffDate: e.target.value })}
            className="pl-10 bg-transparent border-none rounded-full text-foreground focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Passengers & Search Button */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="number"
              min="1"
              max="8"
              placeholder="Passengers"
              value={searchData.passengers}
              onChange={(e) => setSearchData({ ...searchData, passengers: e.target.value })}
              className="pl-10 bg-transparent border-none rounded-full text-foreground focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button
            onClick={handleSearch}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 glow-on-hover"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
