"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MapPin, ArrowLeft, Edit } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  parkingSpots: ParkingSpot[]
}

export default function AdminLocationsPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) {
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
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Ubicaciones Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Aquí puedes ver todas las ubicaciones disponibles en el sistema. Para gestionar los precios de los lugares
              de estacionamiento, ve a la sección de{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/admin/prices")}>
                Gestionar Precios
              </Button>
              .
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                        {location.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{location.address}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/admin/prices")}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar Precios
                    </Button>
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
                          <TableCell>{location.parkingSpots.length}</TableCell>
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
    </div>
  )
}

