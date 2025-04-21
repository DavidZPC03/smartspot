"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function TestReservationPage() {
  const params = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any | null>(null)

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        setLoading(true)
        console.log("Testing reservation with ID:", params.id)

        // Probar la API de prueba
        const testResponse = await fetch(`/api/test-reservation/${params.id}`)
        const testData = await testResponse.json()
        console.log("Test API response:", testData)

        // Probar la API real
        const response = await fetch(`/api/reservations/${params.id}`)
        const responseText = await response.text()

        console.log("API response status:", response.status)
        console.log("API response text:", responseText)

        let data
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          console.error("Failed to parse JSON:", e)
          data = { error: "Invalid JSON response", text: responseText }
        }

        setResult({
          testApi: testData,
          mainApi: {
            status: response.status,
            data: data,
          },
        })
      } catch (error) {
        console.error("Error in test page:", error)
        setError((error as Error).message)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchReservation()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-lg text-gray-600">Probando APIs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Prueba de API de Reservación</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resultados de la prueba</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold">ID de reservación probado:</h3>
              <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">{params.id}</pre>
            </div>

            {result && (
              <>
                <div>
                  <h3 className="font-bold">Respuesta de API de prueba:</h3>
                  <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                    {JSON.stringify(result.testApi, null, 2)}
                  </pre>
                </div>

                <div>
                  <h3 className="font-bold">Respuesta de API principal:</h3>
                  <p>Estado HTTP: {result.mainApi.status}</p>
                  <pre className="bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                    {JSON.stringify(result.mainApi.data, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={() => window.history.back()}>Volver</Button>
      </div>
    </div>
  )
}
