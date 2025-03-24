"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
}

interface ParkingSpot {
  id: string
  spotNumber: number
  isAvailable: boolean
  hourlyRate: number
  locationId: string
}

export default function ParkingSpotsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [updatingSpot, setUpdatingSpot] = useState<string | null>(null)

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      fetchParkingSpots(selectedLocation)
    }
  }, [selectedLocation])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      setError(null)

      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch("/api/admin/locations", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar ubicaciones")
      }

      const data = await response.json()

      // Ensure data is an array
      const locationsArray = Array.isArray(data) ? data : data.locations || []

      setLocations(locationsArray)

      // Seleccionar la primera ubicación por defecto
      if (locationsArray.length > 0 && !selectedLocation) {
        setSelectedLocation(locationsArray[0].id)
      }
    } catch (err) {
      console.error("Error fetching locations:", err)
      setError((err as Error).message)
      setLocations([]) // Ensure locations is always an array
    } finally {
      setLoading(false)
    }
  }

  const fetchParkingSpots = async (locationId: string) => {
    try {
      setLoading(true)
      setParkingSpots([])
      setError(null)

      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/locations/${locationId}/parking-spots`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar lugares de estacionamiento")
      }

      const data = await response.json()

      // Ensure data is an array
      const spotsArray = Array.isArray(data) ? data : []

      setParkingSpots(spotsArray)
    } catch (err) {
      console.error("Error fetching parking spots:", err)
      setError((err as Error).message)
      setParkingSpots([]) // Ensure parkingSpots is always an array
    } finally {
      setLoading(false)
    }
  }

  const toggleSpotAvailability = async (spotId: string, currentStatus: boolean) => {
    try {
      setUpdatingSpot(spotId)
      setError(null)
      setSuccess(null)

      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/parking-spots/${spotId}/toggle-availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el estado del lugar")
      }

      // Actualizar el estado local
      setParkingSpots((spots) =>
        spots.map((spot) => (spot.id === spotId ? { ...spot, isAvailable: !currentStatus } : spot)),
      )

      setSuccess(`Lugar ${currentStatus ? "marcado como ocupado" : "marcado como disponible"} correctamente`)

      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Error toggling spot availability:", err)
      setError((err as Error).message)
    } finally {
      setUpdatingSpot(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Gestión de Lugares de Estacionamiento</h1>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-64">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ubicación" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(locations) && locations.length > 0 ? (
                  locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-locations" disabled>
                    No hay ubicaciones disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {loading && !selectedLocation ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Lugares de estacionamiento</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm">Ocupado</span>
                </div>
              </div>
            </div>

            {loading && selectedLocation ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : parkingSpots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay lugares de estacionamiento disponibles para esta ubicación
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {parkingSpots.map((spot) => (
                  <Card key={spot.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-center text-2xl">{spot.spotNumber}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 flex flex-col items-center">
                      <p className="text-sm text-gray-500 mb-3">${spot.hourlyRate}/hora</p>
                      <Button
                        variant={spot.isAvailable ? "outline" : "destructive"}
                        className={`w-full ${spot.isAvailable ? "hover:bg-red-100 hover:text-red-700 hover:border-red-200" : "bg-red-100 hover:bg-green-100 hover:text-green-700 text-red-700 border-red-200 hover:border-green-200"}`}
                        onClick={() => toggleSpotAvailability(spot.id, spot.isAvailable)}
                        disabled={updatingSpot === spot.id}
                      >
                        {updatingSpot === spot.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : spot.isAvailable ? (
                          <>Marcar Ocupado</>
                        ) : (
                          <>Marcar Disponible</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

