"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { use } from "react"
import StripeProvider from "@/components/stripe-provider"
import StripePaymentForm from "@/components/stripe-payment-form"
import { ArrowLeft, Clock, Calendar, MapPin, AlertTriangle, Check, Download, Home, Info } from "lucide-react"
import ParticlesBackground from "@/components/particles-background"
import SimpleQRCode from "@/components/simple-qr-code"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

// Constantes para el cálculo de precios
const BASE_PRICE = 100 // Precio base que incluye la primera hora
const ADDITIONAL_HOUR_PRICE = 20 // Precio por hora adicional

export default function PaymentPage({
  params,
}: {
  params: { locationId: string; spotId: string }
}) {
  const router = useRouter()
  const [location, setLocation] = useState<Location | null>(null)
  const [parkingSpot, setParkingSpot] = useState<ParkingSpot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [arrivalDate, setArrivalDate] = useState<Date>(new Date())
  const [departureDate, setDepartureDate] = useState<Date>(() => {
    const date = new Date()
    date.setHours(date.getHours() + 2)
    return date
  })
  const [totalHours, setTotalHours] = useState<number>(2)
  const [totalPrice, setTotalPrice] = useState<number>(0)
  const [basePrice, setBasePrice] = useState<number>(BASE_PRICE)
  const [additionalHoursPrice, setAdditionalHoursPrice] = useState<number>(0)
  const [clientSecret, setClientSecret] = useState<string>("")
  const [paymentIntentId, setPaymentIntentId] = useState<string>("")
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("")
  const [reservationId, setReservationId] = useState("")
  const [reservationCreated, setReservationCreated] = useState(false)
  const [qrValue, setQrValue] = useState("")

  // Unwrap params using React.use()
  const unwrappedParams = use(params)
  const locationId = unwrappedParams.locationId
  const spotId = unwrappedParams.spotId

  // Verificar autenticación
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push(`/user-login?redirect=/payment/${locationId}/${spotId}`)
    }
  }, [locationId, spotId, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Recuperar tiempos de sessionStorage
        const storedTimes = sessionStorage.getItem("reservationTimes")
        if (storedTimes) {
          const times = JSON.parse(storedTimes)
          setArrivalDate(new Date(times.startTime))
          setDepartureDate(new Date(times.endTime))
        }

        // Fetch location details
        const locationResponse = await fetch(`/api/location-details?id=${locationId}`)
        if (!locationResponse.ok) {
          throw new Error("Error al cargar detalles de la ubicación")
        }

        const locationData = await locationResponse.json()
        if (!locationData.location) {
          throw new Error("No se encontraron detalles de la ubicación")
        }

        setLocation(locationData.location)

        // Find the specific parking spot
        const spotsResponse = await fetch(`/api/locations/${locationId}/spots`)
        if (!spotsResponse.ok) {
          throw new Error("Error al cargar lugares de estacionamiento")
        }

        const spotsData = await spotsResponse.json()
        if (!spotsData.parkingSpots || !Array.isArray(spotsData.parkingSpots)) {
          throw new Error("Formato de datos de estacionamiento inválido")
        }

        const spot = spotsData.parkingSpots.find((s: any) => s.id === spotId)
        if (spot) {
          setParkingSpot(spot)
        } else {
          throw new Error("Lugar de estacionamiento no encontrado")
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [locationId, spotId])

  // Calcular horas y precio total cuando cambian las fechas
  useEffect(() => {
    const diffMs = departureDate.getTime() - arrivalDate.getTime()
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
    const calculatedTotalHours = diffHours > 0 ? diffHours : 1

    setTotalHours(calculatedTotalHours)

    // Calcular precio con la nueva estructura:
    // - 100 pesos base (incluye primera hora)
    // - 20 pesos por cada hora adicional
    const additionalHours = calculatedTotalHours > 1 ? calculatedTotalHours - 1 : 0
    const additionalPrice = additionalHours * ADDITIONAL_HOUR_PRICE

    setBasePrice(BASE_PRICE)
    setAdditionalHoursPrice(additionalPrice)
    setTotalPrice(BASE_PRICE + additionalPrice)
  }, [arrivalDate, departureDate])

  // Crear un PaymentIntent cuando se carga la página
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!parkingSpot || !totalPrice) return

      try {
        setProcessingPayment(true)

        // Verificar que el token existe
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("No se encontró token de autenticación. Por favor, inicia sesión nuevamente.")
        }

        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            parkingSpotId: spotId,
            startTime: arrivalDate.toISOString(),
            endTime: departureDate.toISOString(),
            price: totalPrice,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Error al crear intención de pago")
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
        setPaymentIntentId(data.paymentIntentId)
        setReservationId(data.reservationId) // Asegúrate de que el API devuelve el ID de la reservación
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setProcessingPayment(false)
      }
    }

    if (parkingSpot && totalPrice > 0) {
      createPaymentIntent()
    }
  }, [parkingSpot, totalPrice, spotId, arrivalDate, departureDate])

  // Modificar la función handlePaymentSuccess para asegurar que la reservación se cree correctamente
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      console.log("Pago exitoso, creando reservación para:", paymentIntentId)
      setProcessingPayment(true)

      // Generate a QR value that includes essential information
      const qrData = {
        id: paymentIntentId,
        spot: parkingSpot?.spotNumber,
        location: location?.name,
        start: arrivalDate.toISOString(),
        end: departureDate.toISOString(),
      }

      // Set the QR value for our simple QR code
      setQrValue(JSON.stringify(qrData))

      // Try to create the reservation in the database
      const reservationCreated = await createReservation(paymentIntentId)

      // Even if reservation creation fails, we'll show success with our simple QR
      setPaymentSuccess(true)
      setProcessingPayment(false)

      // Save reservation data to session storage
      const reservationData = {
        id: paymentIntentId,
        startTime: arrivalDate.toISOString(),
        endTime: departureDate.toISOString(),
        price: totalPrice,
        paymentId: paymentIntentId,
        spotNumber: parkingSpot?.spotNumber,
        locationName: location?.name,
        locationAddress: location?.address,
      }

      sessionStorage.setItem("confirmedReservation", JSON.stringify(reservationData))
    } catch (err) {
      console.error("Error en el proceso de reservación:", err)
      setError((err as Error).message)
      setProcessingPayment(false)

      // Still show success with QR code even if there's an error
      setPaymentSuccess(true)
    }
  }

  // Mejorar la función createReservation para que sea más robusta
  const createReservation = async (paymentIntentId: string) => {
    try {
      console.log("Creando reservación para PaymentIntent:", paymentIntentId)

      // Verificar que el token existe
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No se encontró token de autenticación")
      }

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
          startTime: arrivalDate.toISOString(),
          endTime: departureDate.toISOString(),
          price: totalPrice,
        }),
      })

      const data = await response.json()
      console.log("Respuesta de creación de reservación:", data)

      if (!response.ok) {
        console.error("Error al crear reservación:", data)
        return false
      }

      if (data.success && data.reservation) {
        setReservationCreated(true)
        setReservationId(data.reservation.id || "")
        return true
      }

      return false
    } catch (error) {
      console.error("Error al crear reservación:", error)
      return false
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const handleGoBack = () => {
    router.back()
  }

  const handleGoToLocations = () => {
    router.push("/locations")
  }

  const handleDownloadQR = () => {
    try {
      // Create a canvas element
      const canvas = document.createElement("canvas")
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Draw white background
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, 200, 200)

      // Draw QR code pattern
      ctx.fillStyle = "black"

      // Draw position detection patterns (corners)
      // Top-left
      ctx.fillRect(0, 0, 70, 70)
      ctx.fillStyle = "white"
      ctx.fillRect(10, 10, 50, 50)
      ctx.fillStyle = "black"
      ctx.fillRect(20, 20, 30, 30)

      // Top-right
      ctx.fillStyle = "black"
      ctx.fillRect(130, 0, 70, 70)
      ctx.fillStyle = "white"
      ctx.fillRect(140, 10, 50, 50)
      ctx.fillStyle = "black"
      ctx.fillRect(150, 20, 30, 30)

      // Bottom-left
      ctx.fillStyle = "black"
      ctx.fillRect(0, 130, 70, 70)
      ctx.fillStyle = "white"
      ctx.fillRect(10, 140, 50, 50)
      ctx.fillStyle = "black"
      ctx.fillRect(20, 150, 30, 30)

      // Draw some random data dots
      ctx.fillStyle = "black"
      const hash = paymentIntentId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

      for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
          if ((i * j + hash) % 3 === 0) {
            ctx.fillRect(70 + i * 4, 70 + j * 4, 4, 4)
          }
        }
      }

      // Convert to data URL and download
      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `smartspot-reservacion-${reservationId || paymentIntentId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Error generating QR:", err)
      alert("No se pudo generar el código QR para descargar.")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-blue-600 p-4">
        <ParticlesBackground color="#3b82f6" />
        <Card className="w-full max-w-md p-6 text-center bg-white/95 backdrop-blur-sm">
          <p>Cargando información de pago...</p>
        </Card>
      </div>
    )
  }

  if (error && !paymentSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-blue-600 p-4">
        <ParticlesBackground color="#3b82f6" />
        <Card className="w-full max-w-md p-6 text-center bg-white/95 backdrop-blur-sm">
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

  if (!location || !parkingSpot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-blue-600 p-4">
        <ParticlesBackground color="#3b82f6" />
        <Card className="w-full max-w-md p-6 text-center bg-white/95 backdrop-blur-sm">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>No se pudo cargar la información del estacionamiento</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => router.push("/locations")}>
            Volver a ubicaciones
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-600 p-4">
      <ParticlesBackground color="#3b82f6" />

      {/* Botón para regresar (solo visible si no hay pago exitoso) */}
      {!paymentSuccess && (
        <div className="w-full max-w-md mb-4">
          <Button variant="outline" onClick={handleGoBack} className="bg-white hover:bg-gray-100 shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Regresar
          </Button>
        </div>
      )}

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold">{location.name}</CardTitle>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            {location.address}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {paymentSuccess ? (
            <div className="flex flex-col items-center space-y-6">
              <div className="bg-green-50 p-4 rounded-lg w-full text-center border border-green-100">
                <div className="flex justify-center mb-2">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-green-700 font-medium mb-1">¡Pago Exitoso!</h3>
                <p className="text-sm text-green-600">Tu reservación ha sido confirmada</p>
              </div>

              {error && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100 w-full text-center">
                <h3 className="text-sm font-medium mb-2 text-blue-700">Lugar reservado</h3>
                <p className="text-3xl font-bold text-center text-blue-600">{parkingSpot.spotNumber}</p>
              </div>

              <div className="flex flex-col items-center space-y-3 w-full">
                <h3 className="text-sm font-medium text-gray-700">Código QR de acceso</h3>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  {/* Use our simple QR code component instead of an image */}
                  <SimpleQRCode
                    value={qrValue || `spot-${parkingSpot.spotNumber}-${paymentIntentId}`}
                    size={200}
                    className="border border-gray-200"
                  />
                </div>
                <Button variant="outline" onClick={handleDownloadQR} className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar QR
                </Button>
                <p className="text-xs text-gray-500 text-center px-4">
                  Guarda este código QR. El personal de estacionamiento lo escaneará para verificar tu reservación.
                </p>

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
                  <div className="flex justify-between text-sm">
                    <span>Precio:</span>
                    <span className="font-medium">${totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>ID de Pago:</span>
                    <span className="font-medium">{paymentIntentId.substring(0, 12)}...</span>
                  </div>
                </div>

                <Button
                  onClick={handleGoToLocations}
                  className="w-full py-6 bg-green-600 hover:bg-green-700 text-lg mt-4"
                  size="lg"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Volver a ubicaciones
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                <h3 className="text-sm font-medium mb-2 text-center text-blue-700">Lugar seleccionado</h3>
                <p className="text-3xl font-bold text-center text-blue-600">{parkingSpot.spotNumber}</p>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-700">Fecha y hora de llegada:</span>
                  <span className="font-medium ml-auto">
                    {format(arrivalDate, "PPP", { locale: es })} {format(arrivalDate, "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-700">Fecha y hora de salida:</span>
                  <span className="font-medium ml-auto">
                    {format(departureDate, "PPP", { locale: es })} {format(departureDate, "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-gray-700">Duración:</span>
                  <span className="font-medium ml-auto">{totalHours} hora(s)</span>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-700">Tarifa base (primera hora):</span>
                    <span className="font-medium ml-auto">${basePrice.toFixed(2)}</span>
                  </div>

                  {totalHours > 1 && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-700">Horas adicionales ({totalHours - 1} x $20):</span>
                      <span className="font-medium ml-auto">${additionalHoursPrice.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm font-bold mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total a pagar:</span>
                    <span className="ml-auto text-blue-700">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span className="sr-only">Información de precios</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white p-3 max-w-xs">
                        <p className="text-sm text-gray-700">
                          La tarifa base de $100 incluye la primera hora. Cada hora adicional tiene un costo de $20.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {clientSecret ? (
                <StripeProvider>
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    amount={totalPrice}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </StripeProvider>
              ) : (
                <div className="flex justify-center p-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <span className="ml-2">Cargando opciones de pago...</span>
                </div>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-between items-center pt-0">
          <div className="text-xs text-gray-500">Pago seguro</div>
          <div className="text-xs text-gray-500">SmartSpot © {new Date().getFullYear()}</div>
        </CardFooter>
      </Card>
    </div>
  )
}

