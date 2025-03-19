"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, User, MapPin, Calendar, CreditCard, QrCode } from "lucide-react"
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

        {reservation.payment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" /> Información de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID de Pago</dt>
                  <dd className="font-mono text-xs">{reservation.payment.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Monto</dt>
                  <dd className="text-xl font-bold">
                    ${reservation.payment.amount.toFixed(2)} {reservation.payment.currency}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Estado</dt>
                  <dd>
                    {reservation.payment.status === "COMPLETED" ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Completado
                      </Badge>
                    ) : reservation.payment.status === "PENDING" ? (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        Pendiente
                      </Badge>
                    ) : reservation.payment.status === "FAILED" ? (
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        Fallido
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800">
                        {reservation.payment.status}
                      </Badge>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Método de Pago</dt>
                  <dd>{reservation.payment.paymentMethod}</dd>
                </div>
                {reservation.payment.transactionId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID de Transacción</dt>
                    <dd className="font-mono text-xs">{reservation.payment.transactionId}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha</dt>
                  <dd>
                    {reservation.payment.createdAt
                      ? format(new Date(reservation.payment.createdAt), "PPP", { locale: es })
                      : "No especificado"}
                  </dd>
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
                      {reservation.endTime ? format(new Date(reservation.endTime), "PPP HH:mm", { locale: es }) : "N/A"}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

