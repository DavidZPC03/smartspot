"use client"

import type React from "react"

import { useState } from "react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CreditCard } from "lucide-react"

interface StripePaymentFormProps {
  clientSecret: string
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

export default function StripePaymentForm({ clientSecret, amount, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
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

      if (paymentError) {
        setError(paymentError.message || "Error al procesar el pago")
        onError(paymentError.message || "Error al procesar el pago")
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id)
      } else {
        setError("Estado de pago desconocido. Por favor, contacta a soporte.")
        onError("Estado de pago desconocido")
      }
    } catch (err) {
      setError((err as Error).message || "Error al procesar el pago")
      onError((err as Error).message || "Error al procesar el pago")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-md bg-white shadow-sm">
        <div className="mb-2 flex items-center">
          <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Información de pago</span>
        </div>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div className="text-lg font-bold text-blue-700">Total: ${amount.toFixed(2)}</div>
        <Button type="submit" disabled={!stripe || processing} className="bg-blue-600 hover:bg-blue-700">
          {processing ? "Procesando..." : "Pagar"}
        </Button>
      </div>
    </form>
  )
}

