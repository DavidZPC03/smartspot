"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Download, Check, ArrowLeft, Home } from "lucide-react"
import QRCode from "@/components/qr-code"
import { use } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Location {
  id: string
  name: string
  address: string
}

interface ParkingSpot {
  id: string
  spotNumber: number
  price: number
}

interface Reservation {
  id: string
  qrCode: string
  startTime: string
  endTime: string
  spotNumber?: number
  locationName?: string
  locationAddress?: string
  price?: number
  paymentId?: string
  createdAt?: string
}

export default function ConfirmationPage({
  params,
}: {
  params: { locationId: string; spotId: string }
}) {
  const router = useRouter()
  const [location, setLocation] = useState<Location | null>(null)
  const [parkingSpot, setParkingSpot] = useState<ParkingSpot | null>(null)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollingCount, setPollingCount] = useState(0)

  // Unwrap params using React.use()
  const unwrappedParams = use(params)
  const locationId = unwrappedParams.locationId
  const spotId = unwrappedParams.spotId

  useEffect(() => {
    // Get confirmed reservation from sessionStorage
    const storedReservation = sessionStorage.getItem("confirmedReservation")
    let reservationData = null
    let reservationId = null
    let isStripePayment = false

    if (storedReservation) {
      try {
        reservationData = JSON.parse(storedReservation)
        reservationId = reservationData.id
        isStripePayment = reservationId.startsWith("pi_") // Stripe payment intent IDs start with pi_
        console.log("Found stored reservation:", reservationData)

        // Establecer los datos de la reserva desde sessionStorage
        // para tener algo que mostrar incluso si la API falla
        setReservation({
          id: reservationData.id,
          qrCode: reservationData.qrCode,
          startTime: reservationData.startTime || new Date().toISOString(),
          endTime: reservationData.endTime || new Date(new Date().setHours(new Date().getHours() + 2)).toISOString(),
          price: reservationData.price,
          paymentId: reservationData.paymentId,
        })
      } catch (e) {
        console.error("Error parsing stored reservation:", e)
      }
    } else {
      console.warn("No reservation data found in sessionStorage")
    }

    const fetchData = async () => {
      try {
        console.log("Fetching data for confirmation page. LocationID:", locationId, "SpotID:", spotId)

        // Fetch location details
        const locationResponse = await fetch(`/api/location-details?id=${locationId}`)
        console.log("Location response status:", locationResponse.status)

        if (!locationResponse.ok) {
          throw new Error("Error al cargar detalles de la ubicación")
        }

        const locationData = await locationResponse.json()
        console.log("Location data:", locationData)

        if (!locationData.location) {
          throw new Error("No se encontraron detalles de la ubicación")
        }

        setLocation(locationData.location)

        // Find the specific parking spot
        const spotsResponse = await fetch(`/api/locations/${locationId}/spots`)
        console.log("Spots response status:", spotsResponse.status)

        if (!spotsResponse.ok) {
          throw new Error("Error al cargar lugares de estacionamiento")
        }

        const spotsData = await spotsResponse.json()
        console.log("Spots data received:", spotsData)

        if (!spotsData.parkingSpots || !Array.isArray(spotsData.parkingSpots)) {
          throw new Error("Formato de datos de estacionamiento inválido")
        }

        const spot = spotsData.parkingSpots.find((s: any) => s.id === spotId)
        console.log("Found spot:", spot)

        if (spot) {
          setParkingSpot(spot)
        } else {
          throw new Error("Lugar de estacionamiento no encontrado")
        }

        // Si es un pago de Stripe, necesitamos consultar el estado de la reservación
        if (isStripePayment && reservationId) {
          // Intentar crear la reservación manualmente de inmediato
          await createReservationManually(reservationId, spotId)
        }
      } catch (err) {
        setError((err as Error).message)
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [locationId, spotId, pollingCount])

  // Función para crear la reservación manualmente si el webhook falló
  const createReservationManually = async (paymentIntentId: string, spotId: string) => {
    try {
      console.log("Creando reservación manualmente para PaymentIntent:", paymentIntentId)

      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("No hay token de autenticación disponible")
        return
      }

      // Primero verificar si ya existe la reservación
      const checkResponse = await fetch(`/api/payments/check-status?paymentIntentId=${paymentIntentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (checkResponse.ok) {
        const checkData = await checkResponse.json()

        if (checkData.reservation) {
          console.log("Reservación encontrada en la verificación:", checkData.reservation)

          // Actualizar los datos de la reservación con los datos del servidor
          setReservation({
            id: checkData.reservation.id,
            qrCode: checkData.reservation.qrCode,
            startTime: checkData.reservation.startTime,
            endTime: checkData.reservation.endTime,
            spotNumber: checkData.reservation.parkingSpot?.spotNumber,
            locationName: checkData.reservation.parkingSpot?.location?.name,
            locationAddress: checkData.reservation.parkingSpot?.location?.address,
            price: checkData.reservation.price,
            paymentId: checkData.reservation.paymentId,
            createdAt: checkData.reservation.createdAt,
          })

          // Guardar en sessionStorage para persistencia
          sessionStorage.setItem(
            "confirmedReservation",
            JSON.stringify({
              id: checkData.reservation.id,
              qrCode: checkData.reservation.qrCode,
              startTime: checkData.reservation.startTime,
              endTime: checkData.reservation.endTime,
              spotNumber: checkData.reservation.parkingSpot?.spotNumber,
              locationName: checkData.reservation.parkingSpot?.location?.name,
              locationAddress: checkData.reservation.parkingSpot?.location?.address,
              price: checkData.reservation.price,
              paymentId: checkData.reservation.paymentId,
              createdAt: checkData.reservation.createdAt,
            }),
          )

          return // Si ya existe la reservación, no necesitamos crearla
        }
      }

      // Obtener los datos de la reservación de sessionStorage
      const storedReservation = sessionStorage.getItem("confirmedReservation")
      if (!storedReservation) {
        console.warn("No hay datos de reservación en sessionStorage")
        return
      }

      const reservationData = JSON.parse(storedReservation)

      // Crear la reservación manualmente
      const response = await fetch(`/api/reservations/manual-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentIntentId,
          parkingSpotId: spotId,
          startTime: reservationData.startTime,
          endTime: reservationData.endTime,
          price: reservationData.price,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error de servidor" }))
        console.error("Error al crear reservación manualmente:", errorData)

        // Si falló, intentar nuevamente después de un tiempo
        setTimeout(() => {
          setPollingCount(pollingCount + 1)
        }, 2000)

        return
      }

      const data = await response.json()
      console.log("Reservación creada manualmente:", data)

      if (data.success && data.reservation) {
        setReservation({
          id: data.reservation.id,
          qrCode: data.reservation.qrCode,
          startTime: data.reservation.startTime,
          endTime: data.reservation.endTime,
          spotNumber: data.reservation.parkingSpot?.spotNumber,
          locationName: data.reservation.parkingSpot?.location?.name,
          locationAddress: data.reservation.parkingSpot?.location?.address,
          price: data.reservation.price,
          paymentId: data.reservation.paymentId,
          createdAt: data.reservation.createdAt,
        })

        // Actualizar sessionStorage
        sessionStorage.setItem(
          "confirmedReservation",
          JSON.stringify({
            id: data.reservation.id,
            qrCode: data.reservation.qrCode,
            startTime: data.reservation.startTime,
            endTime: data.reservation.endTime,
            spotNumber: data.reservation.parkingSpot?.spotNumber,
            locationName: data.reservation.parkingSpot?.location?.name,
            locationAddress: data.reservation.parkingSpot?.location?.address,
            price: data.reservation.price,
            paymentId: data.reservation.paymentId,
            createdAt: data.reservation.createdAt,
          }),
        )
      }
    } catch (error) {
      console.error("Error al crear reservación manualmente:", error)

      // Si falló, intentar nuevamente después de un tiempo
      setTimeout(() => {
        setPollingCount(pollingCount + 1)
      }, 2000)
    }
  }

  // Generar datos enriquecidos para el QR
  const generateQRData = () => {
    if (!reservation || !location || !parkingSpot) return ""

    // Crear un objeto con toda la información relevante
    const qrData = {
      reservationId: reservation.id,
      spotNumber: parkingSpot.spotNumber,
      locationName: location.name,
      locationAddress: location.address,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      price: reservation.price || "N/A",
      paymentId: reservation.paymentId || "N/A",
      timestamp: new Date().toISOString(),
    }

    // Convertir a JSON y codificar para el QR
    return JSON.stringify(qrData)
  }

  const handleDownload = () => {
    // En una aplicación real, esto generaría y descargaría un PDF o imagen
    alert("Descargando QR...")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <p>Cargando confirmación...</p>
        </Card>
      </div>
    )
  }

  if (error || !location || !parkingSpot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Error al cargar la información"}</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => router.push("/locations")}>
            Volver a ubicaciones
          </Button>
        </Card>
      </div>
    )
  }

  // Si no tenemos datos de reserva, mostramos un mensaje de error
  if (!reservation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>No se encontró información de la reservación</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => router.push("/locations")}>
            Volver a ubicaciones
          </Button>
        </Card>
      </div>
    )
  }

  // Asegurarnos de que tenemos fechas válidas
  const arrivalDate = reservation.startTime ? new Date(reservation.startTime) : new Date()
  const departureDate = reservation.endTime
    ? new Date(reservation.endTime)
    : new Date(new Date().setHours(new Date().getHours() + 2))

  // Generar datos enriquecidos para el QR
  const qrData = generateQRData()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
      <div className="w-full max-w-md mb-4">
        <Button variant="outline" onClick={() => router.push("/locations")} className="bg-white hover:bg-gray-100">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a ubicaciones
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{location.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{location.address}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-lg mb-4">
              <div className="text-center mb-4">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-medium text-green-600">Tu pago ha sido recibido con éxito</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="text-sm font-medium mb-2 text-center">Lugar disponible seleccionado:</h3>
                <p className="text-3xl font-bold text-center text-blue-600">{parkingSpot.spotNumber}</p>
              </div>
            </div>

            <div className="w-full">
              <h3 className="text-sm font-medium mb-3 text-center">Código QR:</h3>
              <div className="flex justify-center mb-4">
                {reservation.qrCode === "Procesando..." ? (
                  <div className="bg-white p-8 rounded-lg flex items-center justify-center">
                    <p>Generando código QR...</p>
                  </div>
                ) : (
                  <QRCode value={qrData || reservation.qrCode || reservation.id} size={200} />
                )}
              </div>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                disabled={reservation.qrCode === "Procesando..."}
              >
                <Download className="h-4 w-4" />
                Descargar
              </Button>
            </div>

            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fecha y hora de llegada:</span>
                <span className="font-medium">
                  {format(arrivalDate, "PPP", { locale: es })} {format(arrivalDate, "HH:mm")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Fecha y hora de salida:</span>
                <span className="font-medium">
                  {format(departureDate, "PPP", { locale: es })} {format(departureDate, "HH:mm")}
                </span>
              </div>
              {reservation.price && (
                <div className="flex justify-between text-sm">
                  <span>Precio:</span>
                  <span className="font-medium">${reservation.price}</span>
                </div>
              )}
              {reservation.paymentId && (
                <div className="flex justify-between text-sm">
                  <span>ID de Pago:</span>
                  <span className="font-medium">{reservation.paymentId.substring(0, 12)}...</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón grande para volver a ubicaciones */}
      <div className="w-full max-w-md mt-6">
        <Button
          onClick={() => router.push("/locations")}
          className="w-full py-6 bg-green-600 hover:bg-green-700 text-lg"
          size="lg"
        >
          <Home className="mr-2 h-5 w-5" />
          Volver a ubicaciones
        </Button>
      </div>
    </div>
  )
}

