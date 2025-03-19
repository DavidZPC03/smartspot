"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Edit, Save, X, ArrowLeft, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Reservation {
  id: string
  startTime: string
  endTime: string
  status: string
}

interface ParkingSpot {
  id: string
  spotNumber: number
  isAvailable: boolean
  price: number
  activeReservations?: Reservation[]
}

interface Location {
  id: string
  name: string
  address: string
  parkingSpots: ParkingSpot[]
}

export default function AdminPricesPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null)
  const [newPrice, setNewPrice] = useState<string>("")
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [showReservations, setShowReservations] = useState<string | null>(null)
  const [spotReservations, setSpotReservations] = useState<Reservation[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [spotsWithReservations, setSpotsWithReservations] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Verificar si el usuario está autenticado como administrador
    const adminToken = localStorage.getItem("adminToken")
    if (!adminToken) {
      router.push("/admin/login")
      return
    }

    const fetchLocations = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch locations
        const locationsResponse = await fetch("/api/locations")

        if (!locationsResponse.ok) {
          throw new Error("Error al cargar ubicaciones")
        }

        const locationsData = await locationsResponse.json()

        // Obtener detalles de los lugares de estacionamiento para cada ubicación
        const locationsWithSpots = await Promise.all(
          locationsData.locations.map(async (location: any) => {
            const spotsResponse = await fetch(`/api/locations/${location.id}/spots`)
            if (!spotsResponse.ok) {
              return { ...location, parkingSpots: [] }
            }
            const spotsData = await spotsResponse.json()
            return { ...location, parkingSpots: spotsData.parkingSpots || [] }
          }),
        )

        setLocations(locationsWithSpots || [])
      } catch (err) {
        console.error("Error fetching locations:", err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [router])

  const handleEditPrice = (spot: ParkingSpot) => {
    // No necesitamos verificar reservaciones aquí, simplemente abrimos el diálogo
    setEditingSpot(spot)
    setNewPrice(spot.price.toString())
    setUpdateSuccess(null)
    setUpdateError(null)
  }

  const handleUpdatePrice = async () => {
    if (!editingSpot) return

    try {
      setUpdateError(null)
      setUpdateSuccess(null)

      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/parking-spots/${editingSpot.id}/price`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          price: Number.parseFloat(newPrice),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `Error del servidor: ${response.status} ${response.statusText}`,
        }))
        throw new Error(errorData.error || "Error al actualizar el precio")
      }

      const data = await response.json()

      // Actualizar el estado local
      setLocations(
        locations.map((location) => ({
          ...location,
          parkingSpots: location.parkingSpots.map((spot) =>
            spot.id === editingSpot.id ? { ...spot, price: Number.parseFloat(newPrice) } : spot,
          ),
        })),
      )

      setUpdateSuccess("Precio actualizado correctamente")

      // Cerrar el diálogo después de 2 segundos
      setTimeout(() => {
        setEditingSpot(null)
      }, 2000)
    } catch (err) {
      console.error("Error updating price:", err)
      setUpdateError((err as Error).message)
    }
  }

  const handleViewReservations = async (spotId: string) => {
    try {
      setLoadingReservations(true)
      setShowReservations(spotId)

      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/parking-spots/${spotId}/reservations`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar reservaciones")
      }

      const data = await response.json()
      setSpotReservations(data.reservations || [])
    } catch (err) {
      console.error("Error fetching reservations:", err)
      alert((err as Error).message)
    } finally {
      setLoadingReservations(false)
    }
  }

  // Función para verificar si un lugar está actualmente reservado
  const isSpotCurrentlyReserved = (spot: ParkingSpot): boolean => {
    // Simplemente devolvemos false ya que no estamos cargando reservaciones al inicio
    // Solo se cargarán cuando el usuario haga clic en "Ver reservas"
    return false
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Gestión de Precios</h1>
          </div>
          <p className="text-center py-8">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Gestión de Precios</h1>
          </div>
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/admin/dashboard")}>Volver al Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">SMARTSPOT ADMIN</h1>
          <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="container mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Gestión de Precios</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Aquí puedes personalizar los precios de cada lugar de estacionamiento en las diferentes ubicaciones.
              </p>
            </CardContent>
          </Card>

          {locations.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay ubicaciones disponibles</p>
          ) : (
            <div className="space-y-6">
              {locations.map((location) => (
                <Card key={location.id} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <h3 className="font-medium mb-2">Lugares de estacionamiento y precios:</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left">Número</th>
                            <th className="border p-2 text-left">Precio</th>
                            <th className="border p-2 text-left">Estado</th>
                            <th className="border p-2 text-left">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {location.parkingSpots.map((spot) => {
                            const isReserved = isSpotCurrentlyReserved(spot)

                            return (
                              <tr key={spot.id} className={`hover:bg-gray-50 ${isReserved ? "bg-red-50" : ""}`}>
                                <td className="border p-2">{spot.spotNumber}</td>
                                <td className="border p-2">${spot.price}</td>
                                <td className="border p-2">
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      isReserved
                                        ? "bg-red-100 text-red-800"
                                        : spot.isAvailable
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {isReserved ? "Reservado" : spot.isAvailable ? "Disponible" : "No disponible"}
                                  </span>
                                </td>
                                <td className="border p-2">
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditPrice(spot)}
                                      className="flex items-center gap-1"
                                    >
                                      <Edit className="h-4 w-4" />
                                      Editar precio
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewReservations(spot.id)}
                                      className="flex items-center gap-1"
                                    >
                                      <Calendar className="h-4 w-4" />
                                      Ver reservas
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Diálogo para editar precio */}
      {editingSpot && (
        <Dialog open={!!editingSpot} onOpenChange={(open) => !open && setEditingSpot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar precio del lugar #{editingSpot.spotNumber}</DialogTitle>
              <DialogDescription>Modifica el precio del lugar de estacionamiento</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="price">Precio (MXN)</Label>
              <div className="flex items-center mt-2">
                <span className="mr-2">$</span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>

              {updateSuccess && (
                <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                  <AlertTitle>Éxito</AlertTitle>
                  <AlertDescription>{updateSuccess}</AlertDescription>
                </Alert>
              )}

              {updateError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{updateError}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSpot(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleUpdatePrice}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo para ver reservaciones */}
      {showReservations && (
        <Dialog open={!!showReservations} onOpenChange={(open) => !open && setShowReservations(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Reservaciones del lugar</DialogTitle>
              <DialogDescription>Lista de reservaciones para este lugar de estacionamiento</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {loadingReservations ? (
                <p className="text-center py-4">Cargando reservaciones...</p>
              ) : spotReservations.length === 0 ? (
                <p className="text-center py-4">No hay reservaciones para este lugar</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">ID</th>
                        <th className="border p-2 text-left">Inicio</th>
                        <th className="border p-2 text-left">Fin</th>
                        <th className="border p-2 text-left">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {spotReservations.map((reservation) => (
                        <tr key={reservation.id} className="hover:bg-gray-50">
                          <td className="border p-2 font-mono text-xs">{reservation.id}</td>
                          <td className="border p-2">
                            {format(new Date(reservation.startTime), "dd/MM/yyyy HH:mm", { locale: es })}
                          </td>
                          <td className="border p-2">
                            {format(new Date(reservation.endTime), "dd/MM/yyyy HH:mm", { locale: es })}
                          </td>
                          <td className="border p-2">
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                reservation.status === "CONFIRMED" || reservation.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : reservation.status === "PENDING" || reservation.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : reservation.status === "CANCELLED" || reservation.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {reservation.status === "CONFIRMED" || reservation.status === "confirmed"
                                ? "Confirmada"
                                : reservation.status === "PENDING" || reservation.status === "pending"
                                  ? "Pendiente"
                                  : reservation.status === "CANCELLED" || reservation.status === "cancelled"
                                    ? "Cancelada"
                                    : "Completada"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReservations(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

