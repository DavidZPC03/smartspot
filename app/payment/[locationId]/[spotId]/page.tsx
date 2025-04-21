"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Calendar, Clock, MapPin, Download, CreditCard, CheckCircle, Info } from "lucide-react"
import { format, differenceInHours, differenceInMinutes } from "date-fns"
import { es } from "date-fns/locale"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import QRCode from "qrcode"

// Cargar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams<{ locationId: string; spotId: string }>()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [reservationId, setReservationId] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [reservation, setReservation] = useState<any>(null)

  // Información de la ubicación
  const [locationName, setLocationName] = useState<string>("")
  const [locationAddress, setLocationAddress] = useState<string>("")
  const [spotNumber, setSpotNumber] = useState<number>(0)

  // Tiempos de reserva
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [endTime, setEndTime] = useState<Date>(new Date())

  // Información de precios
  const [basePrice, setBasePrice] = useState<number>(100) // Precio base para la primera hora
  const [hourlyRate, setHourlyRate] = useState<number>(20) // Tarifa por hora adicional
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [durationHours, setDurationHours] = useState<number>(0)

  // Información de pago
  const [paymentId, setPaymentId] = useState<string>("")

  useEffect(() => {
    const loadReservationData = async () => {
      try {
        setLoading(true)

        // Limpiar cualquier reserva confirmada previa al cargar una nueva página de pago
        // Esto evita que se muestre automáticamente la pantalla de éxito
        sessionStorage.removeItem("confirmedReservation")
        setPaymentSuccess(false)

        // 1. Obtener información de la ubicación desde sessionStorage
        const locationInfoStr = sessionStorage.getItem("locationInfo")
        let locationInfo = null

        if (locationInfoStr) {
          try {
            locationInfo = JSON.parse(locationInfoStr)
            setLocationName(locationInfo.name || "")
            setLocationAddress(locationInfo.address || "")
          } catch (e) {
            console.error("Error parsing location info:", e)
          }
        }

        // Si no hay información en sessionStorage, intentar obtenerla de la API
        if (!locationInfo) {
          const locationResponse = await fetch(`/api/location-details?id=${params.locationId}`)
          if (locationResponse.ok) {
            const locationData = await locationResponse.json()
            if (locationData.location) {
              setLocationName(locationData.location.name || "")
              setLocationAddress(locationData.location.address || "")
            }
          }
        }

        // 2. Obtener información del espacio de estacionamiento
        const spotResponse = await fetch(`/api/locations/${params.locationId}/spots`)
        if (spotResponse.ok) {
          const spotData = await spotResponse.json()
          if (spotData.parkingSpots) {
            const spot = spotData.parkingSpots.find((s: any) => s.id === params.spotId)
            if (spot) {
              setSpotNumber(spot.spotNumber)
            }
          }
        }

        // 3. Obtener tiempos de reserva desde sessionStorage o URL
        const timesStr = sessionStorage.getItem("reservationTimes")
        let startTimeValue = new Date()
        let endTimeValue = new Date()

        if (timesStr) {
          try {
            const times = JSON.parse(timesStr)
            startTimeValue = new Date(times.startTime)
            endTimeValue = new Date(times.endTime)
          } catch (e) {
            console.error("Error parsing reservation times:", e)
          }
        } else if (searchParams.get("start") && searchParams.get("end")) {
          // Si no hay datos en sessionStorage, intentar obtenerlos de los parámetros de URL
          startTimeValue = new Date(searchParams.get("start") || "")
          endTimeValue = new Date(searchParams.get("end") || "")
        }

        // Asegurarse de que las fechas son válidas
        if (isNaN(startTimeValue.getTime())) startTimeValue = new Date()
        if (isNaN(endTimeValue.getTime())) {
          endTimeValue = new Date(startTimeValue)
          endTimeValue.setHours(endTimeValue.getHours() + 1)
        }

        setStartTime(startTimeValue)
        setEndTime(endTimeValue)

        // 4. Calcular duración y precio
        const hours = Math.max(1, differenceInHours(endTimeValue, startTimeValue))
        setDurationHours(hours)

        // Calcular precio: Asegúrate de que el precio mínimo sea 100 MXN
        // 100 para la primera hora, 20 por cada hora adicional
        let price = basePrice + (hours > 1 ? (hours - 1) * hourlyRate : 0)
        // Asegurarnos que el precio mínimo es 100 pesos
        price = Math.max(price, 100)
        setTotalPrice(price)

        // 5. Crear intención de pago con Stripe
        const paymentResponse = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: price, // Enviar el precio en pesos (la API lo convertirá a centavos)
            locationId: params.locationId,
            spotId: params.spotId,
            startTime: startTimeValue.toISOString(),
            endTime: endTimeValue.toISOString(),
            reservationId: "", // Asegurarse de que este campo esté presente aunque sea vacío
          }),
        })

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json().catch(() => ({ error: "Error de servidor" }))
          throw new Error(errorData.error || "Error al crear la intención de pago")
        }

        const paymentData = await paymentResponse.json()
        setClientSecret(paymentData.clientSecret)
        setReservationId(paymentData.reservationId || paymentData.paymentIntentId)
      } catch (err) {
        console.error("Error loading reservation data:", err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadReservationData()
  }, [params.locationId, params.spotId, searchParams])

  // Función para calcular la duración en formato legible
  const formatDuration = () => {
    const minutes = differenceInMinutes(endTime, startTime)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours === 0) {
      return `${remainingMinutes} minutos`
    } else if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? "hora" : "horas"}`
    } else {
      return `${hours} ${hours === 1 ? "hora" : "horas"} y ${remainingMinutes} minutos`
    }
  }

  // Función para generar el código QR como Data URL
  const generateQRCodeDataURL = async (text: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(text, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
      return qrDataUrl
    } catch (err) {
      console.error("Error generating QR code data URL:", err)
      return null
    }
  }

  // Función para manejar el éxito del pago
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      console.log("Payment successful with ID:", paymentIntentId)
      setPaymentSuccess(true)
      setPaymentId(paymentIntentId)

      // Crear datos para el QR
      const qrData = JSON.stringify({
        id: paymentIntentId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        locationName,
        spotNumber,
        locationId: params.locationId,
        spotId: params.spotId,
        timestamp: new Date().toISOString(),
      })

      setQrCodeData(qrData)

      // Generar QR como data URL para mostrar y descargar
      const dataUrl = await generateQRCodeDataURL(qrData)
      setQrCodeUrl(dataUrl)

      // Save in session storage for persistence across page reloads
      sessionStorage.setItem(
        "confirmedReservation",
        JSON.stringify({
          id: paymentIntentId,
          paymentId: paymentIntentId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          price: totalPrice,
          qrData: qrData,
          qrDataUrl: dataUrl,
        }),
      )

      // Create the reservation manually if needed
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No hay token de autenticación disponible")
        }

        // Create the reservation manually
        const response = await fetch(`/api/reservations/manual-create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentIntentId,
            parkingSpotId: params.spotId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            price: totalPrice,
            metadata: {
              locationName,
              locationAddress,
              spotNumber,
              locationId: params.locationId,
            },
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Error de servidor" }))
          console.error("Error response from server:", errorData)
          // Even if this fails, don't show error to user since payment was successful
          // We already have the QR code generated above
          return
        }

        const data = await response.json()
        if (data.success && data.reservation) {
          console.log("Reservation created successfully:", data.reservation)
          setReservation(data.reservation)

          // If the server returned a QR code, use it, otherwise keep our generated one
          if (data.reservation.qrCode) {
            // Check if it's a data URL or just the data
            if (data.reservation.qrCode.startsWith("data:")) {
              setQrCodeUrl(data.reservation.qrCode)
            } else {
              // If it's just data, keep our generated QR
              setQrCodeData(data.reservation.qrCode)
            }
          }
        }
      } catch (err) {
        console.error("Error creating reservation:", err)
        // We already have the QR code generated above, so no need for fallback
      }
    } catch (err) {
      console.error("Error handling payment success:", err)
    }
  }

  // Función para descargar el código QR
  const downloadQRCode = async () => {
    if (!qrCodeUrl && !qrCodeData) return

    let downloadUrl = qrCodeUrl

    // If we only have the data but not the URL, generate it
    if (!downloadUrl && qrCodeData) {
      downloadUrl = await generateQRCodeDataURL(qrCodeData)
    }

    if (!downloadUrl) return

    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = `reservacion-${reservationId || paymentId || "parking"}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para volver a la página de ubicaciones
  const handleBackToLocations = () => {
    router.push("/locations")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {!paymentSuccess && (
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Regresar
            </Button>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {paymentSuccess ? "Pago de Estacionamiento" : "Pago de Estacionamiento"}
          </h1>
          <p className="text-gray-500 mt-2">
            {paymentSuccess ? "Tu reservación ha sido confirmada" : "Completa tu reservación de manera segura"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-6 bg-red-50 border border-red-100">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : paymentSuccess ? (
          <Card className="bg-white border-0 shadow-xl overflow-hidden">
            <div className="bg-green-500 h-2 w-full"></div>
            <CardHeader className="pb-2">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl text-green-600">¡Pago Exitoso!</CardTitle>
              <p className="text-center text-gray-500 mt-2">Tu reservación ha sido confirmada</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-4">
              <div className="mb-6 p-4 bg-white rounded-lg border border-gray-100 shadow-md">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl || "/placeholder.svg"} alt="Código QR de reservación" className="w-64 h-64" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 text-gray-500">
                    Generando QR...
                  </div>
                )}
              </div>
              <div className="bg-blue-50 rounded-lg p-4 mb-6 w-full max-w-md border border-blue-100">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-700 text-sm">
                    Muestra este código QR al personal del estacionamiento para acceder a tu espacio.
                  </p>
                </div>
              </div>
              <Button
                onClick={downloadQRCode}
                className="bg-green-500 hover:bg-green-600 text-white shadow-md flex items-center gap-2 px-6 py-2.5 mb-4"
              >
                <Download className="h-5 w-5" />
                Descargar Código QR
              </Button>

              <Button
                onClick={handleBackToLocations}
                variant="outline"
                className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a ubicaciones
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center pb-6 pt-2">
              <p className="text-sm text-gray-500">
                Recibirás un correo electrónico con los detalles de tu reservación
              </p>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid md:grid-cols-5 gap-6">
            <div className="md:col-span-3">
              <Card className="bg-white border-0 shadow-lg overflow-hidden mb-6">
                <div className="bg-blue-500 h-2 w-full"></div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    Detalles de la Reservación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-1">{locationName}</h3>
                    <p className="text-blue-700 text-sm">{locationAddress}</p>
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-medium">
                      Espacio {spotNumber}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-700">Fecha de entrada</h3>
                      </div>
                      <p className="text-gray-800">{format(startTime, "PPP", { locale: es })}</p>
                      <p className="text-blue-600 font-medium mt-1">{format(startTime, "HH:mm", { locale: es })}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <h3 className="font-medium text-gray-700">Fecha de salida</h3>
                      </div>
                      <p className="text-gray-800">{format(endTime, "PPP", { locale: es })}</p>
                      <p className="text-blue-600 font-medium mt-1">{format(endTime, "HH:mm", { locale: es })}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <h3 className="font-medium text-gray-700">Duración</h3>
                    </div>
                    <p className="text-gray-800">{formatDuration()}</p>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Tarifa base (primera hora):</span>
                      <span className="font-medium">${basePrice.toFixed(2)} MXN</span>
                    </div>

                    {durationHours > 1 && (
                      <div className="flex justify-between text-gray-600">
                        <span>
                          Horas adicionales ({durationHours - 1} × ${hourlyRate.toFixed(2)}):
                        </span>
                        <span className="font-medium">${((durationHours - 1) * hourlyRate).toFixed(2)} MXN</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-100">
                      <span>Total:</span>
                      <span className="text-blue-600">${totalPrice.toFixed(2)} MXN</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card className="bg-white border-0 shadow-lg overflow-hidden sticky top-6">
                <div className="bg-blue-500 h-2 w-full"></div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    Información de pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripePaymentForm
                        onSuccess={handlePaymentSuccess}
                        amount={totalPrice}
                        clientSecret={clientSecret}
                      />
                    </Elements>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-2 pb-6">
                  <div className="text-center text-lg font-bold text-blue-600">Total: ${totalPrice.toFixed(2)} MXN</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Pago seguro con cifrado SSL
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
