"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, MapPin, Car, Clock } from "lucide-react"
import ReservationTimer from "@/components/reservation-timer"

export default function ReservationStatusPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        if (!params.id) return

        const response = await fetch(`/api/reservations/${params.id}`)
        if (!response.ok) {
          throw new Error("No se pudo cargar la información de la reservación")
        }

        const data = await response.json()
        setReservation(data.reservation)
      } catch (error) {
        console.error("Error fetching reservation:", error)
        setError((error as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchReservation()
  }, [params.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleBack} className="mt-4">
          Volver
        </Button>
      </div>
    )
  }

  const isConfirmed = reservation?.status?.toLowerCase() === "confirmed"

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Estado de Reservación</h1>

      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Reservación {isConfirmed ? "Confirmada" : reservation?.status}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Ubicación</p>
                  <p className="text-gray-600">{reservation?.parkingSpot?.location?.name || "No disponible"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Car className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Espacio</p>
                  <p className="text-gray-600">Lugar {reservation?.parkingSpot?.spotNumber || "No disponible"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">Horario</p>
                  <p className="text-gray-600">
                    {formatDate(reservation?.startTime)}
                    <br />
                    {formatTime(reservation?.startTime)} - {formatTime(reservation?.endTime)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium">Total pagado:</p>
                <p className="text-xl font-bold text-blue-600">${reservation?.price?.toFixed(2)} MXN</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isConfirmed && (
          <ReservationTimer
            reservationId={reservation.id}
            startTime={reservation.startTime}
            endTime={reservation.endTime}
            onTimeExceeded={() => console.log("Tiempo excedido")}
          />
        )}

        <Button onClick={handleBack} className="w-full">
          Volver
        </Button>
      </div>
    </div>
  )
}
