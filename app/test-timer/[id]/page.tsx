"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle } from "lucide-react"
import ReservationTimer from "@/components/reservation-timer"

export default function TestTimerPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [minutesToSubtract, setMinutesToSubtract] = useState(30)
  const [modifying, setModifying] = useState(false)
  const [modified, setModified] = useState(false)
  const [modifyError, setModifyError] = useState<string | null>(null)

  // Cargar los datos de la reservación
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

  // Modificar el tiempo de finalización
  const handleModifyEndTime = async () => {
    try {
      setModifying(true)
      setModifyError(null)

      if (!params.id) {
        throw new Error("ID de reservación no válido")
      }

      // Simular la modificación del tiempo de finalización
      const response = await fetch(`/api/test-timer/modify-end-time`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationId: params.id,
          minutesToSubtract,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al modificar el tiempo de finalización")
      }

      const data = await response.json()
      setReservation(data.reservation)
      setModified(true)
    } catch (error) {
      console.error("Error modifying end time:", error)
      setModifyError((error as Error).message)
    } finally {
      setModifying(false)
    }
  }

  // Ir a la página de estado de la reservación
  const goToReservationStatus = () => {
    router.push(`/reservation-status/${params.id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
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
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Prueba de Cronómetro</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Reservación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">ID</p>
                <p>{reservation?.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <p>{reservation?.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hora de inicio</p>
                <p>{new Date(reservation?.startTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Hora de finalización</p>
                <p>{new Date(reservation?.endTime).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modificar Tiempo de Finalización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minutesToSubtract">Minutos a restar</Label>
                <Input
                  id="minutesToSubtract"
                  type="number"
                  value={minutesToSubtract}
                  onChange={(e) => setMinutesToSubtract(Number.parseInt(e.target.value))}
                  min="1"
                  max="1440"
                />
                <p className="text-sm text-gray-500">
                  Esto restará minutos de la hora de finalización para simular que el tiempo se ha excedido.
                </p>
              </div>

              {modifyError && (
                <Alert variant="destructive">
                  <AlertDescription>{modifyError}</AlertDescription>
                </Alert>
              )}

              {modified && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Tiempo modificado</AlertTitle>
                  <AlertDescription>
                    La hora de finalización ha sido modificada correctamente. Nueva hora de finalización:{" "}
                    {new Date(reservation?.endTime).toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleModifyEndTime} disabled={modifying}>
              {modifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modificando...
                </>
              ) : (
                "Modificar"
              )}
            </Button>
            <Button variant="outline" onClick={goToReservationStatus}>
              Ver Estado de Reservación
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del Cronómetro</CardTitle>
          </CardHeader>
          <CardContent>
            {reservation && (
              <ReservationTimer
                reservationId={reservation.id}
                startTime={reservation.startTime}
                endTime={reservation.endTime}
                onTimeExceeded={() => console.log("Tiempo excedido")}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
