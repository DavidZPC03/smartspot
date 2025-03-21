"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { use } from "react"
import StripeProvider from "@/components/stripe-provider"
import StripePaymentForm from "@/components/stripe-payment-form"
import { ArrowLeft } from "lucide-react" // Importar ícono para el botón de regresar

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
  const [clientSecret, setClientSecret] = useState<string>("")
  const [paymentIntentId, setPaymentIntentId] = useState<string>("")

  // Unwrap params using React.use()
  const unwrappedParams = use(params)
  const locationId = unwrappedParams.locationId
  const spotId = unwrappedParams.spotId

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data for payment page. LocationID:", locationId, "SpotID:", spotId)

        // Recuperar tiempos de sessionStorage
        const storedTimes = sessionStorage.getItem("reservationTimes")
        if (storedTimes) {
          const times = JSON.parse(storedTimes)
          setArrivalDate(new Date(times.startTime))
          setDepartureDate(new Date(times.endTime))
        }

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
      } catch (err) {
        setError((err as Error).message)
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [locationId, spotId])

  // Calcular horas y precio total cuando cambian las fechas o el precio del spot
  useEffect(() => {
    if (parkingSpot) {
      const diffMs = departureDate.getTime() - arrivalDate.getTime()
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
      setTotalHours(diffHours > 0 ? diffHours : 1)
      setTotalPrice(parkingSpot.price * (diffHours > 0 ? diffHours : 1))
    }
  }, [arrivalDate, departureDate, parkingSpot])

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

        console.log("Creando intención de pago con token:", token ? "Presente" : "No encontrado")

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
          console.error("Error response:", errorData)
          throw new Error(errorData.error || "Error al crear intención de pago")
        }

        const data = await response.json()
        console.log("PaymentIntent creado:", data)
        setClientSecret(data.clientSecret)
        setPaymentIntentId(data.paymentIntentId)
      } catch (err) {
        console.error("Error creating payment intent:", err)
        setError((err as Error).message)
      } finally {
        setProcessingPayment(false)
      }
    }

    if (parkingSpot && totalPrice > 0) {
      createPaymentIntent()
    }
  }, [parkingSpot, totalPrice, spotId, arrivalDate, departureDate])

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Guardar los datos de la reservación en sessionStorage para usarlos en la página de confirmación
      const reservationData = {
        id: paymentIntentId, // Usamos el ID del PaymentIntent como ID de reservación temporal
        qrCode: "Procesando...", // El código QR se generará en el servidor
        startTime: arrivalDate.toISOString(),
        endTime: departureDate.toISOString(),
        price: totalPrice,
        paymentId: paymentIntentId,
        // Agregar información adicional que podría ser útil
        spotNumber: parkingSpot?.spotNumber,
        locationName: location?.name,
        locationAddress: location?.address,
      }

      console.log("Saving reservation data to sessionStorage:", reservationData)
      sessionStorage.setItem("confirmedReservation", JSON.stringify(reservationData))

      // Redirigir a la página de confirmación
      router.push(`/confirmation/${locationId}/${spotId}`)
    } catch (err) {
      console.error("Error handling payment success:", err)
      setError((err as Error).message)
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
  }

  // Función para volver a la página anterior
  const handleGoBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <p>Cargando información de pago...</p>
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
      {/* Botón para regresar */}
      <div className="w-full max-w-md mb-4">
        <Button variant="outline" onClick={handleGoBack} className="bg-white hover:bg-gray-100">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{location.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{location.address}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="text-sm font-medium mb-2 text-center">Lugar seleccionado:</h3>
            <p className="text-3xl font-bold text-center text-blue-600">{parkingSpot.spotNumber}</p>
          </div>

          <div className="space-y-2">
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
              <span>Duración:</span>
              <span className="font-medium">{totalHours} hora(s)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Precio por hora:</span>
              <span className="font-medium">${parkingSpot.price}</span>
            </div>
            <div className="flex justify-between text-sm font-bold mt-2">
              <span>Total a pagar:</span>
              <span>${totalPrice}</span>
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
            <div className="flex justify-center">
              <p>Cargando opciones de pago...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

