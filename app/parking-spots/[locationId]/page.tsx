"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ArrowLeft, Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DateTimePicker } from "@/components/datetime-picker"
import { use } from "react"

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
      <div className="flex min-h-screen flex-col items-center justify-center soft-gradient-bg p-4">
        <Card className="soft-card w-full max-w-md p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <p className="text-gray-600">Cargando detalles de la ubicación...</p>
        </Card>
      </div>
    )
  }

  if (error || !location) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center soft-gradient-bg p-4">
        <Card className="soft-card w-full max-w-md p-6 text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Error al cargar la información"}</AlertDescription>
          </Alert>
          <Button className="mt-4 soft-button soft-button-outline" onClick={() => router.push("/locations")}>
            Volver a ubicaciones
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col soft-gradient-bg p-4">
      <div className="container mx-auto max-w-md">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => router.push("/locations")}
            className="soft-button soft-button-outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a ubicaciones
          </Button>
        </div>
        <Card className="mb-6 soft-card">
          <CardHeader className="flex flex-row items-center gap-3 border-b">
            <div className="bg-blue-100 p-2 rounded-full">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">{location.name}</CardTitle>
              <p className="text-sm text-gray-600">{location.address}</p>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Selecciona fecha de reserva</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal soft-button soft-button-outline"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 soft-card">
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
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Hora de entrada
                  </span>
                  <DateTimePicker date={startTime} setDate={setStartTime} showTimeOnly={true} />
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Hora de salida
                  </span>
                  <DateTimePicker date={endTime} setDate={setEndTime} showTimeOnly={true} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold text-gray-800 mb-4">Lugares disponibles</h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-4 soft-card">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : parkingSpots.length === 0 ? (
          <div className="text-center py-8 bg-white/80 backdrop-blur-sm rounded-lg soft-shadow">
            <p className="text-gray-600">No hay lugares disponibles</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg soft-shadow">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-700 text-sm">Disponible</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-700 text-sm">Ocupado</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {parkingSpots.map((spot) => (
                <Card
                  key={spot.id}
                  className={cn(
                    "text-center soft-card",
                    spot.isAvailable ? "border-green-300 hover:border-green-500" : "border-red-300 opacity-75",
                  )}
                >
                  <CardContent className="p-4">
                    <div
                      className={cn(
                        "absolute top-2 right-2 w-3 h-3 rounded-full",
                        spot.isAvailable ? "bg-green-500" : "bg-red-500",
                      )}
                    ></div>
                    <p className="text-3xl font-bold mb-2 text-gray-800">{spot.spotNumber}</p>
                    <p className="text-sm mb-3 text-gray-600">${spot.price}/hora</p>
                    <Button
                      onClick={() => handleSelectSpot(spot.id)}
                      className={cn(
                        "w-full",
                        spot.isAvailable
                          ? "soft-button soft-button-success"
                          : "bg-red-300 text-white cursor-not-allowed",
                      )}
                      disabled={!spot.isAvailable}
                    >
                      {spot.isAvailable ? "Seleccionar" : "Ocupado"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

