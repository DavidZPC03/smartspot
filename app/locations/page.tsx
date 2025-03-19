"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Location {
  id: string
  name: string
  address: string
}

export default function LocationsPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching locations with query:", searchQuery)
        const response = await fetch(`/api/locations?query=${encodeURIComponent(searchQuery)}`)

        console.log("Locations response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Error de servidor" }))
          throw new Error(errorData.error || "Error al cargar ubicaciones")
        }

        const data = await response.json()
        console.log("Locations data:", data)

        if (!data.success || !data.locations) {
          throw new Error("Formato de respuesta inválido")
        }

        setLocations(data.locations)
      } catch (err) {
        console.error("Error fetching locations:", err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // La búsqueda se activa automáticamente por el efecto
  }

  const handleSelectLocation = (locationId: string) => {
    router.push(`/parking-spots/${locationId}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-500 to-blue-700 p-4">
      <div className="container mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-white text-center">Ubicaciones</h1>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar ubicaciones..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <p className="text-center text-white">Cargando ubicaciones...</p>
        ) : locations.length === 0 ? (
          <p className="text-center text-white">No se encontraron ubicaciones</p>
        ) : (
          <div className="space-y-4">
            {locations.map((location) => (
              <Card key={location.id} className="overflow-hidden">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground mb-4">{location.address}</p>
                  <Button onClick={() => handleSelectLocation(location.id)} className="w-full">
                    Seleccionar
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

