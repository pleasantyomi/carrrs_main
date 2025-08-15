"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"

interface BookingDatePickerProps {
  startDate: string
  endDate: string
  onDateChange: (startDate: string, endDate: string) => void
  singleDate?: boolean
}

export function BookingDatePicker({ startDate, endDate, onDateChange, singleDate = false }: BookingDatePickerProps) {
  const today = new Date().toISOString().split("T")[0]

  const handleStartDateChange = (date: string) => {
    onDateChange(date, singleDate ? date : endDate)
  }

  const handleEndDateChange = (date: string) => {
    onDateChange(startDate, date)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="startDate" className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          {singleDate ? "Date" : "Start Date"}
        </Label>
        <Input
          id="startDate"
          type="date"
          min={today}
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          className="bg-background border-border rounded-full"
        />
      </div>

      {!singleDate && (
        <div className="space-y-2">
          <Label htmlFor="endDate" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            End Date
          </Label>
          <Input
            id="endDate"
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="bg-background border-border rounded-full"
          />
        </div>
      )}
    </div>
  )
}
