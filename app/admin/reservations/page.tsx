"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Search, ChevronLeft, ChevronRight, Eye, Clock } from "lucide-react"
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
        return <span className="linear-badge linear-badge-yellow">Pendiente</span>
      case "CONFIRMED":
      case "confirmed":
        return <span className="linear-badge linear-badge-green">Confirmada</span>
      case "CANCELLED":
      case "cancelled":
        return <span className="linear-badge linear-badge-red">Cancelada</span>
      case "COMPLETED":
      case "completed":
        return <span className="linear-badge linear-badge-blue">Completada</span>
      default:
        return <span className="linear-badge">{status}</span>
    }
  }

  const viewReservation = (id: string) => {
    router.push(`/admin/reservations/${id}`)
  }

  const viewReservationStatus = (id: string) => {
    router.push(`/reservation-status/${id}`)
  }

  const testTimer = (id: string) => {
    router.push(`/test-timer/${id}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Administración de Reservaciones</h1>

      <Card className="linear-card overflow-hidden border-0">
        <div className="p-4 border-b border-border/50">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario, ubicación..."
                  className="linear-input pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[200px] linear-input">
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
        </div>

        {error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : loading && reservations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando reservaciones...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="linear-table w-full">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap">ID</th>
                    <th className="whitespace-nowrap">Usuario</th>
                    <th className="whitespace-nowrap">Ubicación</th>
                    <th className="whitespace-nowrap">Lugar</th>
                    <th className="whitespace-nowrap">Fecha Inicio</th>
                    <th className="whitespace-nowrap">Estado</th>
                    <th className="whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No se encontraron reservaciones
                      </td>
                    </tr>
                  ) : (
                    reservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="font-mono text-xs">{reservation.id.substring(0, 8)}...</td>
                        <td>{reservation.user?.name || reservation.user?.phone || "N/A"}</td>
                        <td>{reservation.parkingSpot?.location?.name || "N/A"}</td>
                        <td>{reservation.parkingSpot?.spotNumber || "N/A"}</td>
                        <td>
                          {reservation.startTime
                            ? format(new Date(reservation.startTime), "dd/MM/yyyy HH:mm", { locale: es })
                            : "N/A"}
                        </td>
                        <td>{getStatusBadge(reservation.status)}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewReservation(reservation.id)}
                              className="h-8 w-8 p-0"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewReservationStatus(reservation.id)}
                              className="h-8 w-8 p-0"
                              title="Ver estado"
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            {reservation.status === "CONFIRMED" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testTimer(reservation.id)}
                                className="h-8 text-xs"
                                title="Probar cronómetro"
                              >
                                Probar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border-t border-border/50 gap-4">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Mostrando {reservations.length} de {pagination.total} reservaciones
              </div>
              <div className="flex items-center justify-center sm:justify-end space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="h-8 w-8 p-0"
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
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
