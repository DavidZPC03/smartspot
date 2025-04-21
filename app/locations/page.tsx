"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MapPin, Car, Clock, LogOut, ArrowLeft } from "lucide-react"
import ParticlesBackground from "@/components/particles-background"

interface Location {
  id: string
  name: string
  address: string
  totalSpots: number
  availableSpots: number
  pricePerHour: number
}

export default function LocationsPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch("/api/locations")
        if (!response.ok) {
          throw new Error("Error al cargar ubicaciones")
        }
        const data = await response.json()

        // Asegúrate de que la respuesta tenga la estructura correcta
        if (data && data.locations && Array.isArray(data.locations)) {
          setLocations(data.locations)
        } else {
          setLocations([])
        }
      } catch (err) {
        setError("No se pudieron cargar las ubicaciones. Intente de nuevo más tarde.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  const handleLogout = () => {
    // Eliminar token de autenticación
    localStorage.removeItem("userToken")
    // Redirigir al inicio o página de login
    router.push("/user-login")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-md text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 relative min-h-screen">
      <ParticlesBackground color="#3b82f6" />

      <div className="z-10 relative">
        {/* Navegación superior con botones */}
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/"
            className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg shadow-sm border border-blue-100 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>

          <button
            onClick={handleLogout}
            className="bg-white text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg shadow-sm border border-red-100 transition-colors flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>

        <h1 className="text-3xl font-bold text-blue-600 mb-8 text-center">Ubicaciones Disponibles</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations && locations.length > 0 ? (
            locations.map((location) => (
              <Link href={`/parking-spots/${location.id}`} key={location.id} className="no-underline">
                <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 border border-blue-100 hover:border-blue-300">
                  <h2 className="text-xl font-semibold text-blue-700 mb-2">{location.name}</h2>

                  <div className="flex items-start gap-2 mb-3 text-gray-600">
                    <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p>{location.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Disponibles</p>
                        <p className="font-medium text-gray-800">
                          {location.availableSpots} / {location.totalSpots}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Precio/Hora</p>
                        <p className="font-medium text-gray-800">${location.pricePerHour.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                      Ver Espacios
                    </button>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-600">No hay ubicaciones disponibles en este momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
