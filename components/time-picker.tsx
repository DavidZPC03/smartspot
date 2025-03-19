"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  date: Date
  setDate: (date: Date) => void
}

export function TimePickerDemo({ date, setDate }: TimePickerProps) {
  const [hours, setHours] = useState<number>(date.getHours())
  const [minutes, setMinutes] = useState<number>(date.getMinutes())

  // Update the date when hours or minutes change
  useEffect(() => {
    const newDate = new Date(date)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    setDate(newDate)
  }, [hours, minutes, date, setDate])

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          Horas
        </Label>
        <Input
          id="hours"
          className={cn("w-16 text-center")}
          value={hours}
          onChange={(e) => {
            const newHours = Number.parseInt(e.target.value)
            if (!isNaN(newHours) && newHours >= 0 && newHours <= 23) {
              setHours(newHours)
            }
          }}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          Minutos
        </Label>
        <Input
          id="minutes"
          className={cn("w-16 text-center")}
          value={minutes}
          onChange={(e) => {
            const newMinutes = Number.parseInt(e.target.value)
            if (!isNaN(newMinutes) && newMinutes >= 0 && newMinutes <= 59) {
              setMinutes(newMinutes)
            }
          }}
        />
      </div>
      <div className="flex h-10 items-center">
        <Clock className="ml-2 h-4 w-4" />
      </div>
    </div>
  )
}

