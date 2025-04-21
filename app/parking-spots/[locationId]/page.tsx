"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { format, differenceInHours } from "date-fns"
import { CalendarIcon, ArrowLeft, Clock, MapPin, LogOut, User, Car, Calendar, Clock3 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Cookies from "js-cookie"

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

export default function ParkingSpotsPage() {
  const router = useRouter()
  const params = useParams<{ locationId: string }>()
  const locationId = params.locationId

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
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    // Limpiar cualquier reserva confirmada previa al seleccionar un nuevo espacio
    sessionStorage.removeItem("confirmedReservation")

    // Obtener el nombre del usuario del localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUserName(userData.name || "Usuario")
      } catch (e) {
        console.error("Error parsing user data:", e)
      }
    }

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

      if (!spotsData.parkingSpots) {
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

  // Modificar la función handleSelectSpot para guardar correctamente los tiempos seleccionados
  const handleSelectSpot = (spotId: string) => {
    // Limpiar cualquier reserva confirmada previa al seleccionar un nuevo espacio
    sessionStorage.removeItem("confirmedReservation")

    // Guardar la información de tiempo en sessionStorage
    sessionStorage.setItem(
      "reservationTimes",
      JSON.stringify({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      }),
    )

    // También guardar la información de la ubicación
    if (location) {
      sessionStorage.setItem(
        "locationInfo",
        JSON.stringify({
          id: location.id,
          name: location.name,
          address: location.address,
        }),
      )
    }

    router.push(`/payment/${locationId}/${spotId}`)
  }

  const handleLogout = () => {
    // Limpiar localStorage y cookies
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    Cookies.remove("token", { path: "/" })

    // Redirigir a la página de inicio
    router.push("/")
  }

  // Calcular la duración en horas
  const calculateDuration = () => {
    return differenceInHours(endTime, startTime) || 1 // Mínimo 1 hora
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/locations")}
            className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a ubicaciones
          </Button>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
              <User className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm font-medium">{userName || "Usuario"}</span>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Cerrar sesión</span>
            </Button>
          </div>
        </div>

        {loading && !location ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-4 bg-white border border-red-200 shadow-sm">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : location ? (
          <>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-8 overflow-hidden">
              <div className="bg-blue-600 text-white p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{location.name}</h1>
                    <p className="text-blue-100">{location.address}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                  Selecciona Fecha y Hora
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      <CalendarIcon className="inline-block mr-1 h-4 w-4" /> Fecha
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={format(selectedDate, "yyyy-MM-dd")}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value)
                          if (!isNaN(newDate.getTime())) {
                            handleDateChange(newDate)
                          }
                        }}
                        className="w-full p-2 border border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      <Clock className="inline-block mr-1 h-4 w-4" /> Hora de Inicio
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={startTime.getHours().toString().padStart(2, "0")}
                        onChange={(e) => {
                          const newDate = new Date(startTime)
                          newDate.setHours(Number.parseInt(e.target.value))
                          setStartTime(newDate)
                        }}
                        className="p-2 border border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i.toString().padStart(2, "0")}>
                            {i.toString().padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <span>:</span>
                      <select
                        value={startTime.getMinutes().toString().padStart(2, "0")}
                        onChange={(e) => {
                          const newDate = new Date(startTime)
                          newDate.setMinutes(Number.parseInt(e.target.value))
                          setStartTime(newDate)
                        }}
                        className="p-2 border border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {["00", "15", "30", "45"].map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      <Clock3 className="inline-block mr-1 h-4 w-4" /> Hora de Fin
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={endTime.getHours().toString().padStart(2, "0")}
                        onChange={(e) => {
                          const newDate = new Date(endTime)
                          newDate.setHours(Number.parseInt(e.target.value))
                          setEndTime(newDate)
                        }}
                        className="p-2 border border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i.toString().padStart(2, "0")}>
                            {i.toString().padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <span>:</span>
                      <select
                        value={endTime.getMinutes().toString().padStart(2, "0")}
                        onChange={(e) => {
                          const newDate = new Date(endTime)
                          newDate.setMinutes(Number.parseInt(e.target.value))
                          setEndTime(newDate)
                        }}
                        className="p-2 border border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        {["00", "15", "30", "45"].map((minute) => (
                          <option key={minute} value={minute}>
                            {minute}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-blue-100 p-4 rounded-lg border border-blue-200 flex items-center">
                  <Clock className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-blue-800">
                    Duración estimada: <span className="font-semibold">{calculateDuration()} horas</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Car className="mr-2 h-5 w-5 text-blue-500" />
                Lugares disponibles
              </h2>

              <div className="flex justify-between items-center mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-700 text-sm">Disponible</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-700 text-sm">Ocupado</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : parkingSpots.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-600">No hay lugares disponibles</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {parkingSpots.map((spot) => (
                  <Card
                    key={spot.id}
                    className={`overflow-hidden transition-all duration-200 hover:shadow-md ${
                      spot.isAvailable ? "border-green-200 hover:border-green-400" : "border-red-200 opacity-75"
                    }`}
                  >
                    <div className={`h-2 ${spot.isAvailable ? "bg-green-500" : "bg-red-500"}`}></div>
                    <CardContent className="p-0">
                      <div className="p-4 text-center">
                        <div className="mb-2 text-4xl font-bold text-gray-800">{spot.spotNumber}</div>
                        <div className="mb-3 text-sm font-medium text-gray-600">${spot.price}/hora</div>
                      </div>

                      <div className={`px-4 pb-4 ${spot.isAvailable ? "" : "opacity-50"}`}>
                        {spot.isAvailable ? (
                          <Button
                            onClick={() => handleSelectSpot(spot.id)}
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                          >
                            Seleccionar
                          </Button>
                        ) : (
                          <Button disabled className="w-full bg-red-300 text-white cursor-not-allowed">
                            Ocupado
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
