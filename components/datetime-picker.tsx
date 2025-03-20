"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  date: Date
  setDate: (date: Date) => void
  label?: string
  disabled?: boolean
  showTimeOnly?: boolean
}

export function DateTimePicker({ date, setDate, label, disabled = false, showTimeOnly = false }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(date)
  const [selectedHour, setSelectedHour] = useState<string>(date.getHours().toString().padStart(2, "0"))
  const [selectedMinute, setSelectedMinute] = useState<string>(date.getMinutes().toString().padStart(2, "0"))

  // Solo actualizar la fecha padre cuando cambian los valores seleccionados
  useEffect(() => {
    const newDate = new Date(selectedDate)
    newDate.setHours(Number.parseInt(selectedHour, 10))
    newDate.setMinutes(Number.parseInt(selectedMinute, 10))

    // Comparar si la fecha ha cambiado realmente para evitar actualizaciones innecesarias
    if (newDate.getTime() !== date.getTime()) {
      setDate(newDate)
    }
  }, [selectedDate, selectedHour, selectedMinute])

  // Generar opciones para horas y minutos
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutes = ["00", "15", "30", "45"] // Simplificamos a intervalos de 15 minutos

  return (
    <div className="flex flex-col space-y-2 w-full">
      {label && <span className="text-sm font-medium">{label}</span>}
      <div className="flex flex-col space-y-2">
        {!showTimeOnly && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        )}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 border rounded-md p-2 w-full">
            <Clock className="h-4 w-4 text-muted-foreground ml-1" />
            <Select value={selectedHour} onValueChange={setSelectedHour} disabled={disabled}>
              <SelectTrigger className="w-[60px] border-0 p-0 focus:ring-0">
                <SelectValue placeholder="Hora" />
              </SelectTrigger>
              <SelectContent position="popper" className="h-[200px]">
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>:</span>
            <Select value={selectedMinute} onValueChange={setSelectedMinute} disabled={disabled}>
              <SelectTrigger className="w-[60px] border-0 p-0 focus:ring-0">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent position="popper">
                {minutes.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

