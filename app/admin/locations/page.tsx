"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, ArrowLeft, Edit, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

interface ParkingSpot {
  id: string
  spotNumber: number
  isAvailable: boolean
  price: number
}

interface Location {
  id: string
  name: string
  address: string
  city?: string
  state?: string
  country?: string
  totalSpots: number
  parkingSpots: ParkingSpot[]
}

export default function AdminLocationsPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para el diálogo de edición/creación
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    totalSpots: "0",
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    // Verificar si el usuario está autenticado como administrador
    const adminToken = localStorage.getItem("adminToken")
    if (!adminToken) {
      router.push("/admin/login")
      return
    }

    fetchLocations()
  }, [router])

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

  const handleAddLocation = () => {
    setIsEditing(false)
    setCurrentLocation(null)
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      totalSpots: "10", // Valor predeterminado
    })
    setFormError(null)
    setFormSuccess(null)
    setIsDialogOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setIsEditing(true)
    setCurrentLocation(location)
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city || "",
      state: location.state || "",
      country: location.country || "",
      // Asegurarse de que totalSpots sea un string
      totalSpots: location.totalSpots ? location.totalSpots.toString() : "0",
    })
    setFormError(null)
    setFormSuccess(null)
    setIsDialogOpen(true)
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta ubicación? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      setLoading(true)

      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/locations/${locationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar la ubicación")
      }

      // Actualizar la lista de ubicaciones
      setLocations(locations.filter((loc) => loc.id !== locationId))
      alert("Ubicación eliminada correctamente")
    } catch (err) {
      console.error("Error deleting location:", err)
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      // Validar datos
      if (!formData.name || !formData.address) {
        throw new Error("Nombre y dirección son obligatorios")
      }

      const totalSpots = Number.parseInt(formData.totalSpots)
      if (isNaN(totalSpots) || totalSpots < 1) {
        throw new Error("El número de lugares debe ser un número positivo")
      }

      // Preparar datos para enviar
      const locationData = {
        name: formData.name,
        address: formData.address,
        totalSpots,
      }

      let response
      if (isEditing && currentLocation) {
        // Actualizar ubicación existente
        response = await fetch(`/api/admin/locations/${currentLocation.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(locationData),
        })
      } else {
        // Crear nueva ubicación
        response = await fetch("/api/admin/locations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(locationData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar la ubicación")
      }

      const data = await response.json()

      setFormSuccess(isEditing ? "Ubicación actualizada correctamente" : "Ubicación creada correctamente")

      // Actualizar la lista de ubicaciones
      fetchLocations()

      // Cerrar el diálogo después de 2 segundos
      setTimeout(() => {
        setIsDialogOpen(false)
      }, 2000)
    } catch (err) {
      console.error("Error saving location:", err)
      setFormError((err as Error).message)
    } finally {
      setFormLoading(false)
    }
  }

  if (loading && locations.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Administración de Ubicaciones</h1>
          </div>
          <p className="text-center py-8">Cargando ubicaciones...</p>
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
            <h1 className="text-2xl font-bold">Administración de Ubicaciones</h1>
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
    <div className="flex min-h-screen flex-col bg-gray-100 p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Administración de Ubicaciones</h1>
          <Button onClick={handleAddLocation} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Agregar Ubicación
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ubicaciones Disponibles</CardTitle>
            <CardDescription>
              Aquí puedes ver, agregar, editar y eliminar las ubicaciones disponibles en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Gestiona las ubicaciones y el número de lugares de estacionamiento disponibles en cada una.
            </p>
          </CardContent>
        </Card>

        {locations.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-muted-foreground mb-4">No hay ubicaciones disponibles</p>
            <Button onClick={handleAddLocation} className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Agregar Primera Ubicación
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {locations.map((location) => (
              <Card key={location.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                        {location.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{location.address}</p>
                      {location.city && (
                        <p className="text-xs text-muted-foreground">
                          {location.city}, {location.state}, {location.country}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleEditLocation(location)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-1 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteLocation(location.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <h3 className="font-medium mb-2">Resumen de lugares de estacionamiento:</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Total de Lugares</TableHead>
                          <TableHead>Disponibles</TableHead>
                          <TableHead>Ocupados</TableHead>
                          <TableHead>Rango de Precios</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>{location.totalSpots}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {location.parkingSpots.filter((spot) => spot.isAvailable).length}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-100 text-red-800">
                              {location.parkingSpots.filter((spot) => !spot.isAvailable).length}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {location.parkingSpots.length > 0
                              ? `$${Math.min(...location.parkingSpots.map((spot) => spot.price))} - $${Math.max(...location.parkingSpots.map((spot) => spot.price))}`
                              : "No hay lugares"}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo para agregar/editar ubicación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Ubicación" : "Agregar Nueva Ubicación"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica los detalles de la ubicación y el número de lugares de estacionamiento."
                : "Ingresa los detalles de la nueva ubicación."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitLocation}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="name">Nombre de la Ubicación</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Centro Comercial Plaza Mayor"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej. Av. Principal #123"
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="totalSpots">Número de Lugares de Estacionamiento</Label>
                <Input
                  id="totalSpots"
                  type="number"
                  min="1"
                  value={formData.totalSpots}
                  onChange={(e) => setFormData({ ...formData, totalSpots: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {isEditing
                    ? "Al cambiar este número, se agregarán o eliminarán lugares de estacionamiento según corresponda."
                    : "Este será el número total de lugares disponibles en esta ubicación."}
                </p>
              </div>

              {formError && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              {formSuccess && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertTitle>Éxito</AlertTitle>
                  <AlertDescription>{formSuccess}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

