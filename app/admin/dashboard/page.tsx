"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar, Users, MapPin, CreditCard } from "lucide-react"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar si el usuario está autenticado como administrador
    const adminToken = localStorage.getItem("adminToken")
    console.log("Admin token:", adminToken ? "Present" : "Not found")

    if (!adminToken) {
      console.log("No admin token found, redirecting to login")
      router.push("/admin/login")
      return
    }

    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("admin")
    // Eliminar la cookie
    document.cookie = "adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/admin/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100 p-4">
        <div className="container mx-auto">
          <p className="text-center">Cargando datos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100 p-4">
        <div className="container mx-auto">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/admin/login")}>Volver al login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <header className="bg-gray-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">SMARTSPOT ADMIN</h1>
          <Button variant="outline" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="container mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Panel de Administración</CardTitle>
            </CardHeader>
            <CardContent>
              <p>¡Bienvenido al panel de administración de SMARTSPOT!</p>
              <p className="mt-4">Desde aquí podrás gestionar:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Reservaciones</li>
                <li>Usuarios</li>
                <li>Ubicaciones</li>
                <li>Precios de estacionamiento</li>
                <li>Pagos con Stripe</li>
              </ul>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => router.push("/admin/reservations")}
                  className="h-20 flex items-center justify-center"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Gestionar Reservaciones
                </Button>
                <Button onClick={() => router.push("/admin/users")} className="h-20 flex items-center justify-center">
                  <Users className="mr-2 h-5 w-5" />
                  Gestionar Usuarios
                </Button>
                <Button
                  onClick={() => router.push("/admin/locations")}
                  className="h-20 flex items-center justify-center"
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Gestionar Ubicaciones
                </Button>
                <Button onClick={() => router.push("/admin/prices")} className="h-20 flex items-center justify-center">
                  <span className="mr-2 text-lg font-bold">$</span>
                  Gestionar Precios
                </Button>
                <Button
                  onClick={() => router.push("/admin/payments")}
                  className="h-20 flex items-center justify-center"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Ver Pagos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

