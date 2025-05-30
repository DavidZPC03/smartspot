"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, User, MapPin, Calendar, CreditCard, QrCode, Edit, Save, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { use } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateTimePicker } from "@/components/datetime-picker"

export default function ReservationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  // Usar React.use para desenvolver params
  const unwrappedParams = use(params)
  const reservationId = unwrappedParams.id

  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null)

  // Estados para la edición
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    startTime: new Date(),
    endTime: new Date(),
    price: "",
    status: "",
  })

  useEffect(() => {
    const fetchReservationDetails = async () => {
      try {
        setLoading(true)

        // Obtener el token de autenticación
        const adminToken = localStorage.getItem("adminToken")
        if (!adminToken) {
          throw new Error("No estás autenticado como administrador")
        }

        const response = await fetch(`/api/admin/reservations/${reservationId}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.")
          }
          throw new Error("Error al cargar detalles de la reservación")
        }

        const data = await response.json()
        setReservation(data.reservation)

        // Inicializar el formulario de edición con los datos actuales
        if (data.reservation) {
          setEditForm({
            startTime: new Date(data.reservation.startTime),
            endTime: new Date(data.reservation.endTime),
            price: data.reservation.price?.toString() || "0",
            status: data.reservation.status,
          })
        }
      } catch (err) {
        console.error("Error fetching reservation details:", err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchReservationDetails()
  }, [reservationId])

  const updateReservationStatus = async (status: string) => {
    try {
      setStatusLoading(true)
      setStatusError(null)
      setStatusSuccess(null)

      // Obtener el token de autenticación
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar estado")
      }

      const data = await response.json()
      setReservation(data.reservation)
      setStatusSuccess("Estado actualizado exitosamente")
    } catch (err) {
      setStatusError((err as Error).message)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleEditReservation = async () => {
    try {
      setStatusLoading(true)
      setStatusError(null)
      setStatusSuccess(null)

      // Obtener el token de autenticación
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/reservations/${reservationId}/edit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          startTime: editForm.startTime.toISOString(),
          endTime: editForm.endTime.toISOString(),
          price: Number.parseFloat(editForm.price),
          status: editForm.status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error del servidor" }))
        throw new Error(errorData.error || "Error al actualizar la reservación")
      }

      const data = await response.json()
      setReservation(data.reservation)
      setStatusSuccess("Reservación actualizada exitosamente")
      setIsEditing(false)
    } catch (err) {
      setStatusError((err as Error).message)
    } finally {
      setStatusLoading(false)
    }
  }

  const deleteReservation = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta reservación? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      setStatusLoading(true)

      // Obtener el token de autenticación
      const adminToken = localStorage.getItem("adminToken")
      if (!adminToken) {
        throw new Error("No estás autenticado como administrador")
      }

      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al eliminar reservación")
      }

      router.push("/admin/reservations")
    } catch (err) {
      setStatusError((err as Error).message)
      setStatusLoading(false)
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

  const getStripePaymentStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Completado
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            Procesando
          </Badge>
        )
      case "requires_payment_method":
        return (
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            Requiere método de pago
          </Badge>
        )
      case "requires_confirmation":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Requiere confirmación
          </Badge>
        )
      case "canceled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800">
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/admin/reservations")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/admin/reservations")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
        <h1 className="text-2xl font-bold">Detalles de Reservación</h1>
        <div className="flex space-x-2">
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
          )}
          <Button variant="destructive" onClick={deleteReservation} disabled={statusLoading}>
            Eliminar
          </Button>
        </div>
      </div>

      {statusError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{statusError}</AlertDescription>
        </Alert>
      )}

      {statusSuccess && (
        <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{statusSuccess}</AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Editar Reservación</CardTitle>
            <CardDescription>Modifica los detalles de la reservación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateTimePicker
                  date={editForm.startTime}
                  setDate={(date) => setEditForm({ ...editForm, startTime: date })}
                  label="Fecha y hora de inicio"
                />

                <DateTimePicker
                  date={editForm.endTime}
                  setDate={(date) => setEditForm({ ...editForm, endTime: date })}
                  label="Fecha y hora de fin"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <div className="flex items-center">
                    <span className="mr-2">$</span>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                      <SelectItem value="CANCELLED">Cancelada</SelectItem>
                      <SelectItem value="COMPLETED">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleEditReservation} disabled={statusLoading}>
                <Save className="mr-2 h-4 w-4" />
                {statusLoading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" /> Información del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                  <dd>{reservation.user?.name || "No especificado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                  <dd>{reservation.user?.phone || "No especificado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd>{reservation.user?.email || "No especificado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Placa</dt>
                  <dd>{reservation.user?.licensePlate || "No especificado"}</dd>
                </div>
                {reservation.user?.stripeCustomerId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID de Cliente Stripe</dt>
                    <dd className="font-mono text-xs">{reservation.user.stripeCustomerId}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" /> Ubicación y Lugar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
                  <dd>{reservation.parkingSpot?.location?.name || "No especificado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                  <dd>{reservation.parkingSpot?.location?.address || "No especificado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ciudad</dt>
                  <dd>{reservation.parkingSpot?.location?.city || "No especificado"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lugar</dt>
                  <dd className="text-2xl font-bold text-blue-600">{reservation.parkingSpot?.spotNumber || "N/A"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" /> Detalles de Reservación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID</dt>
                  <dd className="font-mono text-xs">{reservation.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Estado</dt>
                  <dd className="flex items-center space-x-2">
                    <span>{getStatusBadge(reservation.status)}</span>
                    <Select value={reservation.status} onValueChange={updateReservationStatus} disabled={statusLoading}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Cambiar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pendiente</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                        <SelectItem value="CANCELLED">Cancelada</SelectItem>
                        <SelectItem value="COMPLETED">Completada</SelectItem>
                      </SelectContent>
                    </Select>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha y hora de inicio</dt>
                  <dd>
                    {reservation.startTime ? (
                      <>
                        {format(new Date(reservation.startTime), "PPP", { locale: es })}
                        {" a las "}
                        {format(new Date(reservation.startTime), "HH:mm", { locale: es })}
                      </>
                    ) : (
                      "No especificado"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha y hora de fin</dt>
                  <dd>
                    {reservation.endTime ? (
                      <>
                        {format(new Date(reservation.endTime), "PPP", { locale: es })}
                        {" a las "}
                        {format(new Date(reservation.endTime), "HH:mm", { locale: es })}
                      </>
                    ) : (
                      "No especificado"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Precio</dt>
                  <dd className="text-xl font-bold">${reservation.price || "0.00"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Creada</dt>
                  <dd>
                    {reservation.createdAt
                      ? format(new Date(reservation.createdAt), "PPP", { locale: es })
                      : "No especificado"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Tarjeta de información de pago de Stripe */}
          {reservation.stripePaymentIntentId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" /> Información de Pago Stripe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID de PaymentIntent</dt>
                    <dd className="font-mono text-xs">{reservation.stripePaymentIntentId}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estado de Pago</dt>
                    <dd>
                      {reservation.stripePaymentStatus ? (
                        getStripePaymentStatusBadge(reservation.stripePaymentStatus)
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800">
                          No disponible
                        </Badge>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Método de Pago</dt>
                    <dd className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Tarjeta de crédito (Stripe)</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Monto</dt>
                    <dd className="text-xl font-bold">${reservation.price || "0.00"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

          {reservation.qrCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="mr-2 h-5 w-5" /> Código QR
                </CardTitle>
                <CardDescription>Código para acceso al estacionamiento</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-lg mb-4">
                  <div className="text-center mb-2">
                    <p className="text-3xl font-bold font-mono">{reservation.qrCode}</p>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Ver Instrucciones de Verificación</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Verificación de Código QR</DialogTitle>
                      <DialogDescription>Instrucciones para verificar el código QR</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <p>Para verificar este código QR:</p>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Utilice la aplicación de administrador</li>
                        <li>Seleccione la opción "Verificar QR"</li>
                        <li>
                          Ingrese el código: <span className="font-mono font-bold">{reservation.qrCode}</span>
                        </li>
                        <li>O escanee el código QR directamente</li>
                      </ol>
                      <p className="text-sm text-muted-foreground mt-4">
                        Este código es válido desde{" "}
                        {reservation.startTime
                          ? format(new Date(reservation.startTime), "PPP HH:mm", { locale: es })
                          : "N/A"}{" "}
                        hasta{" "}
                        {reservation.endTime
                          ? format(new Date(reservation.endTime), "PPP HH:mm", { locale: es })
                          : "N/A"}
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

