"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Clock, AlertTriangle } from "lucide-react"
import { differenceInSeconds, format } from "date-fns"
import { es } from "date-fns/locale"

interface ReservationTimerProps {
  reservationId: string
  startTime: Date
  endTime: Date
  onTimeExceeded?: () => void
}

export default function ReservationTimer({ reservationId, startTime, endTime, onTimeExceeded }: ReservationTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isActive, setIsActive] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [timeExceededBy, setTimeExceededBy] = useState(0)
  const [additionalCharge, setAdditionalCharge] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [chargeSuccess, setChargeSuccess] = useState(false)
  const [chargeError, setChargeError] = useState<string | null>(null)

  // Convertir las fechas a objetos Date si son strings
  const startTimeDate = startTime instanceof Date ? startTime : new Date(startTime)
  const endTimeDate = endTime instanceof Date ? endTime : new Date(endTime)

  // Calcular el tiempo total de la reservación en segundos
  const totalDurationSeconds = differenceInSeconds(endTimeDate, startTimeDate)

  // Calcular el tiempo restante en segundos
  const getRemainingSeconds = () => {
    return Math.max(0, differenceInSeconds(endTimeDate, currentTime))
  }

  // Calcular el tiempo excedido en segundos
  const getExceededSeconds = () => {
    return Math.max(0, differenceInSeconds(currentTime, endTimeDate))
  }

  // Calcular el porcentaje de tiempo restante
  const getProgressPercentage = () => {
    if (isExpired) return 100
    const remainingSeconds = getRemainingSeconds()
    return 100 - Math.min(100, Math.round((remainingSeconds / totalDurationSeconds) * 100))
  }

  // Formatear el tiempo restante o excedido
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${secs}s`
  }

  // Calcular el cargo adicional (20 pesos por cada 15 minutos excedidos)
  const calculateAdditionalCharge = (exceededSeconds: number) => {
    const exceededMinutes = Math.ceil(exceededSeconds / 60)
    const exceededBlocks = Math.ceil(exceededMinutes / 15)
    return exceededBlocks * 20 // 20 pesos por cada bloque de 15 minutos
  }

  // Manejar el cobro automático
  const handleAutomaticCharge = async () => {
    if (isCharging || chargeSuccess) return

    setIsCharging(true)
    setChargeError(null)

    try {
      const response = await fetch(`/api/reservations/${reservationId}/additional-charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exceededMinutes: Math.ceil(timeExceededBy / 60),
          amount: additionalCharge,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al realizar el cobro adicional")
      }

      const data = await response.json()
      setChargeSuccess(true)
    } catch (error) {
      console.error("Error charging additional time:", error)
      setChargeError((error as Error).message)
    } finally {
      setIsCharging(false)
    }
  }

  // Efecto para actualizar el tiempo cada segundo
  useEffect(() => {
    // Iniciar el cronómetro solo si la hora actual está entre startTime y endTime
    const now = new Date()
    if (now >= startTimeDate && now <= endTimeDate) {
      setIsActive(true)
    } else if (now > endTimeDate) {
      setIsActive(true)
      setIsExpired(true)
      const exceededSeconds = getExceededSeconds()
      setTimeExceededBy(exceededSeconds)
      setAdditionalCharge(calculateAdditionalCharge(exceededSeconds))
    }

    const interval = setInterval(() => {
      const newTime = new Date()
      setCurrentTime(newTime)

      if (newTime > endTimeDate && !isExpired) {
        setIsExpired(true)
        if (onTimeExceeded) {
          onTimeExceeded()
        }
      }

      if (isExpired) {
        const exceededSeconds = getExceededSeconds()
        setTimeExceededBy(exceededSeconds)
        setAdditionalCharge(calculateAdditionalCharge(exceededSeconds))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startTimeDate, endTimeDate, isExpired, onTimeExceeded])

  // Si no está activo, no mostrar nada
  if (!isActive) {
    return null
  }

  return (
    <Card className={isExpired ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          {isExpired ? (
            <>
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">Tiempo excedido</span>
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-blue-700">Tiempo restante</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Inicio: {format(startTimeDate, "HH:mm", { locale: es })}</span>
            <span>Fin: {format(endTimeDate, "HH:mm", { locale: es })}</span>
          </div>

          <Progress value={getProgressPercentage()} className={isExpired ? "bg-red-200" : "bg-blue-200"} />

          <div className="text-center">
            {isExpired ? (
              <div className="space-y-2">
                <p className="text-red-600 font-semibold">Tiempo excedido por: {formatTime(timeExceededBy)}</p>
                <p className="text-red-600 font-bold text-lg">Cargo adicional: ${additionalCharge.toFixed(2)} MXN</p>

                {!chargeSuccess && (
                  <Button
                    variant="destructive"
                    className="mt-2 w-full"
                    onClick={handleAutomaticCharge}
                    disabled={isCharging}
                  >
                    {isCharging ? "Procesando cobro..." : "Realizar pago adicional"}
                  </Button>
                )}

                {chargeSuccess && <p className="text-green-600 font-semibold">¡Pago adicional realizado con éxito!</p>}

                {chargeError && <p className="text-red-600 text-sm">Error: {chargeError}</p>}
              </div>
            ) : (
              <p className="text-blue-600 font-bold text-2xl">{formatTime(getRemainingSeconds())}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
