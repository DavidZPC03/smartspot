"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Clock, AlertTriangle } from "lucide-react"

interface ReservationTimerProps {
  reservationId: string
  startTime: Date | string
  endTime: Date | string
  onTimeExceeded?: () => void
}

export default function ReservationTimer({ reservationId, startTime, endTime, onTimeExceeded }: ReservationTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [timeExceeded, setTimeExceeded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [additionalCharge, setAdditionalCharge] = useState<number | null>(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Convertir las fechas a objetos Date si son strings
  const startTimeDate = startTime instanceof Date ? startTime : new Date(startTime)
  const endTimeDate = endTime instanceof Date ? endTime : new Date(endTime)

  // Calcular el tiempo restante en milisegundos
  const calculateTimeRemaining = useCallback(() => {
    const now = new Date()
    const end = endTimeDate
    const remaining = end.getTime() - now.getTime()
    return remaining
  }, [endTimeDate])

  // Formatear el tiempo restante en horas, minutos y segundos
  const formatTimeRemaining = useCallback((milliseconds: number) => {
    if (milliseconds <= 0) return "00:00:00"

    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }, [])

  // Calcular el tiempo excedido en minutos
  const calculateExceededTime = useCallback(() => {
    const now = new Date()
    const end = endTimeDate
    const exceededMs = now.getTime() - end.getTime()
    return Math.max(1, Math.ceil(exceededMs / (1000 * 60))) // Mínimo 1 minuto
  }, [endTimeDate])

  // Calcular el cargo adicional basado en el tiempo excedido
  const calculateAdditionalCharge = useCallback((exceededMinutes: number) => {
    // Tarifa por minuto excedido (ajustar según necesidades)
    const ratePerMinute = 0.5 // $0.50 MXN por minuto
    return Math.max(10, exceededMinutes * ratePerMinute) // Mínimo $10 MXN
  }, [])

  // Procesar el pago adicional
  const handleAdditionalPayment = async () => {
    try {
      setPaymentProcessing(true)
      setError(null)

      // Calcular el tiempo excedido y el cargo
      const exceededMinutes = calculateExceededTime()
      const amount = calculateAdditionalCharge(exceededMinutes)

      console.log("Sending payment request:", {
        reservationId,
        exceededMinutes,
        amount,
      })

      if (!amount || amount <= 0) {
        throw new Error("El monto del cargo adicional no puede ser cero o negativo")
      }

      const response = await fetch(`/api/reservations/${reservationId}/additional-charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exceededMinutes,
          amount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al realizar el cobro adicional")
      }

      const data = await response.json()
      console.log("Additional payment processed:", data)
      setPaymentSuccess(true)
    } catch (error) {
      console.error("Error processing additional payment:", error)
      setError((error as Error).message)
    } finally {
      setPaymentProcessing(false)
    }
  }

  // Actualizar el tiempo cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)

      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)

      // Verificar si el tiempo se ha excedido
      if (remaining <= 0 && !timeExceeded) {
        setTimeExceeded(true)
        // Calcular el cargo adicional
        const exceededMinutes = calculateExceededTime()
        setAdditionalCharge(calculateAdditionalCharge(exceededMinutes))
        // Llamar al callback si existe
        if (onTimeExceeded) {
          onTimeExceeded()
        }
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [calculateTimeRemaining, calculateExceededTime, calculateAdditionalCharge, timeExceeded, onTimeExceeded])

  // Verificar si el tiempo ya está excedido al cargar el componente
  useEffect(() => {
    const checkInitialTime = () => {
      const remaining = calculateTimeRemaining()
      setTimeRemaining(remaining)

      if (remaining <= 0 && !timeExceeded) {
        setTimeExceeded(true)
        const exceededMinutes = calculateExceededTime()
        setAdditionalCharge(calculateAdditionalCharge(exceededMinutes))
        if (onTimeExceeded) {
          onTimeExceeded()
        }
      }
    }

    checkInitialTime()
    // Este efecto solo debe ejecutarse una vez al montar el componente
  }, [])

  if (timeRemaining === null) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (paymentSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Pago Adicional</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-green-100 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium">¡Pago procesado correctamente!</p>
            <p className="text-gray-600">
              Se ha procesado el pago adicional de ${additionalCharge?.toFixed(2)} MXN por tiempo excedido.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (timeExceeded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Tiempo Excedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center">
              Has excedido el tiempo de tu reservación por{" "}
              <span className="font-bold">{calculateExceededTime()} minutos</span>.
            </p>

            <div className="rounded-md bg-amber-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Cargo adicional</h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      Se aplicará un cargo adicional de{" "}
                      <span className="font-bold">
                        ${calculateAdditionalCharge(calculateExceededTime()).toFixed(2)} MXN
                      </span>{" "}
                      a tu método de pago.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button className="w-full" onClick={handleAdditionalPayment} disabled={paymentProcessing}>
              {paymentProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Realizar pago adicional"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Tiempo Restante
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="text-4xl font-bold tabular-nums text-blue-600">{formatTimeRemaining(timeRemaining)}</div>
          <p className="mt-2 text-sm text-gray-600">
            Tu reservación termina a las {endTimeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
