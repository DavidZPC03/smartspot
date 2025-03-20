"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { use } from "react"
import { DateTimePicker } from "@/components/datetime-picker"

interface Location {
  id: string
  name: string
  address: string
}

interface ParkingSpot {
  id: string
  spotNumber: number
  price: number
  isAvailable: boolean
}

export default function ParkingSpotsPage({
  params,
}: {
  params: { locationId: string }
}) {
  const router = useRouter()
  const [location, setLocation] = useState<Location | null>(null)
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [endTime, setEndTime] = useState<Date>(() => {
    const date = new Date()
    date.setHours(date.getHours() + 2) // Por defecto, 2 horas después
    return date
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Unwrap params using React.use()
  const unwrappedParams = use(params)
  const locationId = unwrappedParams.locationId

  useEffect(() => {
    const fetchLocationDetails = async () => {
      try {
        console.log("Fetching location details for ID:", locationId)

        // Fetch location details
        const locationResponse = await fetch(`/api/location-details?id=${locationId}`)
        console.log("Location response status:", locationResponse.status)

        if (!locationResponse.ok) {
          throw new Error("Error al cargar detalles de la ubicación")
        }

        const locationData = await locationResponse.json()
        console.log("Location data:", locationData)

        if (!locationData.location) {
          throw new Error("No se encontraron detalles de la ubicación")
        }

        setLocation(locationData.location)

        // Fetch parking spots
        await fetchParkingSpots()
      } catch (err) {
        setError((err as Error).message)
        console.error("Error fetching location details:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLocationDetails()
  }, [locationId])

  const fetchParkingSpots = async () => {
    try {
      setLoading(true)

      const dateString = format(selectedDate, "yyyy-MM-dd")
      console.log("Fetching parking spots for date:", dateString)

      const spotsResponse = await fetch(`/api/locations/${locationId}/spots?date=${dateString}`)
      console.log("Spots response status:", spotsResponse.status)

      if (!spotsResponse.ok) {
        throw new Error("Error al cargar lugares de estacionamiento")
      }

      const spotsData = await spotsResponse.json()
      console.log("Spots data:", spotsData)

      if (!spotsData.success || !spotsData.parkingSpots) {
        throw new Error("Formato de datos de estacionamiento inválido")
      }

      setParkingSpots(spotsData.parkingSpots)
    } catch (err) {
      setError((err as Error).message)
      console.error("Error fetching parking spots:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
    fetchParkingSpots()
  }

  const handleSelectSpot = (spotId: string) => {
    // Guardar la información de tiempo en sessionStorage
    sessionStorage.setItem(
      "reservationTimes",
      JSON.stringify({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      }),
    )

    router.push(`/payment/${locationId}/${spotId}`)
  }

  if (loading && !location) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <p>Cargando detalles de la ubicación...</p>
        </Card>
      </div>
    )
  }

  if (error || !location) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Error al cargar la información"}</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => router.push("/locations")}>
            Volver a ubicaciones
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-500 to-blue-700 p-4">
      <div className="container mx-auto max-w-md">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{location.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{location.address}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Selecciona fecha de reserva</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && handleDateChange(date)}
                      initialFocus
                      locale={es}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Hora de entrada</span>
                  <DateTimePicker date={startTime} setDate={setStartTime} showTimeOnly={true} />
                </div>

                <div>
                  <span className="text-sm font-medium">Hora de salida</span>
                  <DateTimePicker date={endTime} setDate={setEndTime} showTimeOnly={true} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold text-white mb-4">Lugares disponibles</h2>

        {loading ? (
          <p className="text-center text-white">Cargando lugares...</p>
        ) : error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : parkingSpots.length === 0 ? (
          <p className="text-center text-white">No hay lugares disponibles</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {parkingSpots.map((spot) => (
              <Card key={spot.id} className={cn("text-center", !spot.isAvailable && "opacity-50")}>
                <CardContent className="p-4">
                  <p className="text-3xl font-bold mb-2">{spot.spotNumber}</p>
                  <p className="text-sm mb-3">${spot.price}/hora</p>
                  <Button onClick={() => handleSelectSpot(spot.id)} className="w-full" disabled={!spot.isAvailable}>
                    {spot.isAvailable ? "Seleccionar" : "No disponible"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

