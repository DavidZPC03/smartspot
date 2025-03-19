"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Search, ChevronLeft, ChevronRight, Eye, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminReservationsPage() {
  const router = useRouter()
  const [reservations, setReservations] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const fetchReservations = async () => {
    try {
      setLoading(true)

      // Obtener el token de autenticación
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (statusFilter) {
        queryParams.append("status", statusFilter)
      }

      if (searchQuery) {
        queryParams.append("search", searchQuery)
      }

      // Incluir el token en el encabezado de autorización
      const response = await fetch(`/api/admin/reservations?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.")
        }
        throw new Error("Error al cargar reservaciones")
      }

      const data = await response.json()

      // Si no hay datos de paginación, usar valores predeterminados
      if (!data.pagination) {
        data.pagination = {
          total: data.reservations?.length || 0,
          page: 1,
          limit: 10,
          pages: 1,
        }
      }

      setReservations(data.reservations || [])
      setPagination(data.pagination)
    } catch (err) {
      console.error("Error fetching reservations:", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Verificar si el usuario está autenticado como administrador
    const adminToken = localStorage.getItem("adminToken")
    if (!adminToken) {
      router.push("/admin/login")
      return
    }

    fetchReservations()
  }, [pagination.page, statusFilter, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    fetchReservations()
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setPagination({ ...pagination, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Pendiente
          </Badge>
        )
      case "CONFIRMED":
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Confirmada
          </Badge>
        )
      case "CANCELLED":
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Cancelada
          </Badge>
        )
      case "COMPLETED":
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Completada
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const viewReservation = (id: string) => {
    router.push(`/admin/reservations/${id}`)
  }

  if (loading && reservations.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-100 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Administración de Reservaciones</h1>
          </div>
          <p className="text-center py-8">Cargando reservaciones...</p>
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
            <h1 className="text-2xl font-bold">Administración de Reservaciones</h1>
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
          <h1 className="text-2xl font-bold">Administración de Reservaciones</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por usuario, ubicación..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>

              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-40">Cargando...</div>
        ) : (
          <>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Lugar</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No se encontraron reservaciones
                        </TableCell>
                      </TableRow>
                    ) : (
                      reservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium">{reservation.id.substring(0, 8)}...</TableCell>
                          <TableCell>{reservation.user?.name || reservation.user?.phone || "N/A"}</TableCell>
                          <TableCell>{reservation.parkingSpot?.location?.name || "N/A"}</TableCell>
                          <TableCell>{reservation.parkingSpot?.spotNumber || "N/A"}</TableCell>
                          <TableCell>
                            {reservation.startTime
                              ? format(new Date(reservation.startTime), "dd/MM/yyyy HH:mm", { locale: es })
                              : "N/A"}
                          </TableCell>
                          <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="icon" onClick={() => viewReservation(reservation.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {reservations.length} de {pagination.total} reservaciones
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {pagination.page} de {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

