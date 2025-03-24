"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, Users, MapPin, TrendingUp, Clock, BarChart } from "lucide-react"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReservations: 0,
    totalLocations: 0,
    totalRevenue: 0,
    activeReservations: 0,
    recentReservations: 0,
  })

  useEffect(() => {
    // Verificar si el usuario está autenticado como administrador
    const adminToken = localStorage.getItem("adminToken")
    if (!adminToken) {
      router.push("/admin/login")
      return
    }

    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        console.log("Fetching dashboard stats with token:", adminToken.substring(0, 10) + "...")

        const response = await fetch("/api/admin/dashboard", {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })

        console.log("Dashboard response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Error de servidor" }))
          throw new Error(errorData.error || "Error al obtener datos del dashboard")
        }

        const data = await response.json()
        console.log("Dashboard data received:", data)

        setStats({
          totalUsers: data.totalUsers || 0,
          totalReservations: data.totalReservations || 0,
          totalLocations: data.totalLocations || 0,
          totalRevenue: data.totalRevenue || 0,
          activeReservations: data.activeReservations || 0,
          recentReservations: data.recentReservations || 0,
        })
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
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
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="text-sm text-muted-foreground">Última actualización: {new Date().toLocaleString("es-MX")}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Usuarios"
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5" />}
          onClick={() => router.push("/admin/users")}
          description="Total de usuarios registrados"
        />
        <StatCard
          title="Reservaciones"
          value={stats.totalReservations}
          icon={<Calendar className="h-5 w-5" />}
          onClick={() => router.push("/admin/reservations")}
          description="Total de reservaciones"
        />
        <StatCard
          title="Ubicaciones"
          value={stats.totalLocations}
          icon={<MapPin className="h-5 w-5" />}
          onClick={() => router.push("/admin/locations")}
          description="Ubicaciones disponibles"
        />
        <StatCard
          title="Ingresos"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          onClick={() => router.push("/admin/reservations")}
          description="Ingresos totales"
        />
        {stats.activeReservations > 0 ? (
          <StatCard
            title="Reservaciones Activas"
            value={stats.activeReservations}
            icon={<Clock className="h-5 w-5" />}
            onClick={() => router.push("/admin/reservations")}
            description="Reservaciones en curso"
          />
        ) : (
          <StatCard
            title="Reservaciones Recientes"
            value={stats.recentReservations}
            icon={<BarChart className="h-5 w-5" />}
            onClick={() => router.push("/admin/reservations")}
            description="Últimos 7 días"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="linear-card overflow-hidden border-0">
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={() => router.push("/admin/reservations")}
                className="linear-button linear-button-primary h-auto py-3"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Gestionar Reservaciones
              </Button>
              <Button
                onClick={() => router.push("/admin/users")}
                className="linear-button linear-button-primary h-auto py-3"
              >
                <Users className="mr-2 h-4 w-4" />
                Gestionar Usuarios
              </Button>
              <Button
                onClick={() => router.push("/admin/locations")}
                className="linear-button linear-button-primary h-auto py-3"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Gestionar Ubicaciones
              </Button>
              <Button
                onClick={() => router.push("/admin/prices")}
                className="linear-button linear-button-primary h-auto py-3"
              >
                <span className="mr-2 text-lg font-bold">$</span>
                Gestionar Precios
              </Button>
            </div>
          </div>
        </Card>

        <Card className="linear-card overflow-hidden border-0">
          <div className="p-6">
            <h2 className="text-lg font-medium mb-4">Información del Sistema</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-muted-foreground">Versión</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-muted-foreground">Entorno</span>
                <span className="font-medium">
                  {process.env.NODE_ENV === "production" ? "Producción" : "Desarrollo"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-muted-foreground">Última actualización</span>
                <span className="font-medium">{new Date().toLocaleDateString("es-MX")}</span>
              </div>
              <div className="pt-2">
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  onClick: () => void
  description: string
}

function StatCard({ title, value, icon, onClick, description }: StatCardProps) {
  return (
    <Card
      className="linear-card overflow-hidden border-0 transition-all duration-200 hover:border-primary/50 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="p-2 rounded-full bg-primary/10 text-primary">{icon}</div>
        </div>
      </div>
    </Card>
  )
}

