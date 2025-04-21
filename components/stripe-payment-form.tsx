"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CreditCard, Lock } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentFormProps {
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onError?: (error: string) => void // Make this optional
  reservationId?: string
  clientSecret?: string | null
}

function PaymentForm({ amount, onSuccess, onError, clientSecret }: StripePaymentFormProps & { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!stripe || !elements || !isMounted) {
        return
      }

      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        setError("No se pudo encontrar el elemento de tarjeta")
        return
      }

      setProcessing(true)
      setError(null)

      try {
        const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        })

        if (!isMounted) return

        if (paymentError) {
          setError(paymentError.message || "Error al procesar el pago")
          if (onError) onError(paymentError.message || "Error al procesar el pago")
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
          onSuccess(paymentIntent.id)
        } else {
          setError("Estado de pago desconocido. Por favor, contacta a soporte.")
          if (onError) onError("Estado de pago desconocido")
        }
      } catch (err) {
        if (!isMounted) return
        setError((err as Error).message || "Error al procesar el pago")
        if (onError) onError((err as Error).message || "Error al procesar el pago")
      } finally {
        if (isMounted) {
          setProcessing(false)
        }
      }
    },
    [stripe, elements, clientSecret, onSuccess, onError, isMounted],
  )

  if (!isMounted) {
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Información de tarjeta</span>
          </div>
        </div>
        <div className="p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                  padding: "10px 0",
                },
                invalid: {
                  color: "#e53e3e",
                  iconColor: "#e53e3e",
                },
              },
              hidePostalCode: true,
            }}
            className="py-2"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border border-red-100">
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium shadow-md"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Procesando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              Pagar ${amount.toFixed(2)} MXN
            </span>
          )}
        </Button>

        <div className="flex justify-center gap-2 mt-2">
          <img src="/visa.svg" alt="Visa" className="h-6" />
          <img src="/mastercard.svg" alt="Mastercard" className="h-6" />
          <img src="/amex.svg" alt="American Express" className="h-6" />
        </div>
      </div>
    </form>
  )
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  const [ready, setReady] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(props.clientSecret || null)

  useEffect(() => {
    if (props.clientSecret) {
      setClientSecret(props.clientSecret)
      setReady(true)
      return
    }

    const getPaymentIntent = async () => {
      try {
        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: props.amount, // Send amount directly, we'll convert to cents in the API
            reservationId: props.reservationId || "",
          }),
        })

        if (!response.ok) {
          throw new Error("Error al crear la intención de pago")
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (error) {
        console.error("Error:", error)
        if (props.onError) props.onError((error as Error).message)
      } finally {
        setReady(true)
      }
    }

    getPaymentIntent()
  }, [props.amount, props.reservationId, props.clientSecret, props.onError])

  if (!ready || !clientSecret) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#3b82f6",
            colorBackground: "#ffffff",
            borderRadius: "8px",
          },
        },
      }}
    >
      <PaymentForm {...props} clientSecret={clientSecret} />
    </Elements>
  )
}
