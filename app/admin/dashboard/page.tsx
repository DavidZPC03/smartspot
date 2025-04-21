"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Car,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Importamos recharts para las gráficas
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("7d")
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReservations: 0,
    totalLocations: 0,
    revenue: 0,
    activeReservations: 0,
    occupancyRate: 0,
    revenueChange: 12.5,
    usersChange: 8.2,
    reservationsChange: 15.3,
  })

  // Datos de ejemplo para las gráficas
  const [chartData, setChartData] = useState({
    reservationTrend: [
      { name: "Lun", reservations: 4 },
      { name: "Mar", reservations: 6 },
      { name: "Mié", reservations: 8 },
      { name: "Jue", reservations: 7 },
      { name: "Vie", reservations: 12 },
      { name: "Sáb", reservations: 15 },
      { name: "Dom", reservations: 10 },
    ],
    locationOccupancy: [
      { name: "Plaza Mayor", value: 85 },
      { name: "Centro Comercial", value: 65 },
      { name: "Zona Industrial", value: 45 },
      { name: "Aeropuerto", value: 90 },
    ],
    hourlyDistribution: [
      { hour: "8AM", count: 5 },
      { hour: "10AM", count: 12 },
      { hour: "12PM", count: 18 },
      { hour: "2PM", count: 15 },
      { hour: "4PM", count: 22 },
      { hour: "6PM", count: 30 },
      { hour: "8PM", count: 25 },
    ],
    revenueData: [
      { name: "Lun", revenue: 1200 },
      { name: "Mar", revenue: 1800 },
      { name: "Mié", revenue: 2400 },
      { name: "Jue", revenue: 2100 },
      { name: "Vie", revenue: 3600 },
      { name: "Sáb", revenue: 4500 },
      { name: "Dom", revenue: 3000 },
    ],
  })

  // Colores para las gráficas
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  useEffect(() => {
    // Verificar si el usuario está autenticado como administrador
    const adminToken = localStorage.getItem("adminToken")
    if (!adminToken) {
      router.push("/admin-login")
      return
    }

    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard", {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Error al obtener datos del dashboard")
        }

        const data = await response.json()

        // En un entorno real, usaríamos los datos de la API
        // Por ahora, combinamos datos reales con datos de ejemplo para las visualizaciones
        setStats({
          totalUsers: data.totalUsers || 125,
          totalReservations: data.totalReservations || 348,
          totalLocations: data.totalLocations || 6,
          revenue: data.revenue || 25800,
          activeReservations: data.activeReservations || 42,
          occupancyRate: data.occupancyRate || 78,
          revenueChange: data.revenueChange || 12.5,
          usersChange: data.usersChange || 8.2,
          reservationsChange: data.reservationsChange || 15.3,
        })

        // En un entorno real, también obtendríamos los datos para las gráficas de la API
        // setChartData(data.chartData)
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [router])

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    // En un entorno real, aquí haríamos una nueva petición para obtener datos según el rango de tiempo
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const currentDateTime = new Date().toLocaleString("es-ES", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24 horas</SelectItem>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Usuarios"
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          change={stats.usersChange}
          trend="up"
        />

        <StatCard
          title="Reservaciones"
          value={stats.totalReservations}
          icon={<Calendar className="h-5 w-5 text-green-600" />}
          change={stats.reservationsChange}
          trend="up"
        />

        <StatCard
          title="Ingresos"
          value={`$${stats.revenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-purple-600" />}
          change={stats.revenueChange}
          trend="up"
        />

        <StatCard
          title="Ocupación"
          value={`${stats.occupancyRate}%`}
          icon={<Activity className="h-5 w-5 text-orange-600" />}
          change={5.3}
          trend="up"
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="reservations">Reservaciones</TabsTrigger>
          <TabsTrigger value="revenue">Ingresos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Tendencia de Reservaciones */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Tendencia de Reservaciones</CardTitle>
                <CardDescription>Reservaciones diarias en los últimos 7 días</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.reservationTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="reservations"
                        stroke="#0088FE"
                        fillOpacity={1}
                        fill="url(#colorReservations)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Ocupación por Ubicación */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Ocupación por Ubicación</CardTitle>
                <CardDescription>Porcentaje de ocupación por ubicación</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.locationOccupancy}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {chartData.locationOccupancy.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reservaciones Activas y Próximas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Reservaciones Activas</CardTitle>
              <CardDescription>Reservaciones actualmente en curso</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">ID</th>
                      <th className="text-left py-3 px-2">Usuario</th>
                      <th className="text-left py-3 px-2">Ubicación</th>
                      <th className="text-left py-3 px-2">Inicio</th>
                      <th className="text-left py-3 px-2">Fin</th>
                      <th className="text-left py-3 px-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">RES-1234</td>
                      <td className="py-3 px-2">Juan Pérez</td>
                      <td className="py-3 px-2">Plaza Mayor</td>
                      <td className="py-3 px-2">10:30 AM</td>
                      <td className="py-3 px-2">12:30 PM</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activa
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">RES-1235</td>
                      <td className="py-3 px-2">María González</td>
                      <td className="py-3 px-2">Centro Comercial</td>
                      <td className="py-3 px-2">11:00 AM</td>
                      <td className="py-3 px-2">01:00 PM</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activa
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">RES-1236</td>
                      <td className="py-3 px-2">Carlos Rodríguez</td>
                      <td className="py-3 px-2">Aeropuerto</td>
                      <td className="py-3 px-2">09:45 AM</td>
                      <td className="py-3 px-2">02:45 PM</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Próxima
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-right">
                <Button variant="link" onClick={() => router.push("/admin/reservations")} className="text-sm">
                  Ver todas las reservaciones →
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribución por Hora */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Distribución por Hora</CardTitle>
                <CardDescription>Reservaciones por hora del día</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.hourlyDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#00C49F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Métricas de Reservaciones */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Métricas de Reservaciones</CardTitle>
                <CardDescription>Estadísticas clave de reservaciones</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    title="Tiempo Promedio"
                    value="2.5 horas"
                    icon={<Clock className="h-5 w-5 text-blue-600" />}
                  />
                  <MetricCard
                    title="Reservas Activas"
                    value={stats.activeReservations.toString()}
                    icon={<Car className="h-5 w-5 text-green-600" />}
                  />
                  <MetricCard
                    title="Tasa de Cancelación"
                    value="8.3%"
                    icon={<TrendingUp className="h-5 w-5 text-red-600" />}
                  />
                  <MetricCard
                    title="Satisfacción"
                    value="92%"
                    icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Ingresos por Día</CardTitle>
              <CardDescription>Ingresos diarios en los últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Ingresos"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Ingresos Totales</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold">${stats.revenue.toLocaleString()}</span>
                  <span className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    {stats.revenueChange}% vs. período anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Ingreso Promedio</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold">$74.13</span>
                  <span className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    3.2% vs. período anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Proyección Mensual</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold">$86,400</span>
                  <span className="text-sm text-green-600 flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    8.7% vs. mes anterior
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-right text-xs text-gray-400 mt-8">Última actualización: {currentDateTime}</div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  change: number
  trend: "up" | "down"
}

function StatCard({ title, value, icon, change, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl md:text-3xl font-bold mt-1">{value}</p>
            <div
              className={`flex items-center mt-1 text-xs font-medium ${trend === "up" ? "text-green-600" : "text-red-600"}`}
            >
              {trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {change}% vs. período anterior
            </div>
          </div>
          <div className="rounded-full p-2 bg-gray-100">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
}

function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
      <div className="rounded-full p-2 bg-white">{icon}</div>
    </div>
  )
}
