"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

// Importar las funciones de validación
import { isValidPhone, isValidLicensePlate } from "@/lib/validations"

export default function UserLoginPage() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+52")
  const [licensePlate, setLicensePlate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Actualizar la función handleSubmit para incluir validaciones
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Combinar código de país y número de teléfono
      const fullPhone = `${countryCode}${phoneNumber}`

      // Validar formato de teléfono
      if (!isValidPhone(fullPhone)) {
        throw new Error("Por favor ingrese un número de teléfono válido")
      }

      // Validar formato de placa
      if (!isValidLicensePlate(licensePlate)) {
        throw new Error("Por favor ingrese una placa válida (entre 2 y 10 caracteres)")
      }

      console.log("Submitting login with:", { phone: fullPhone, licensePlate })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: fullPhone,
          licensePlate,
        }),
      })

      console.log("Login response status:", response.status)

      // Si la respuesta no es exitosa, mostrar el error
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error de servidor" }))

        // Si el error es 404 (usuario no encontrado), mostrar un mensaje específico
        if (response.status === 404) {
          throw new Error(errorData.error || "Usuario no encontrado. Por favor, regístrese primero.")
        }

        throw new Error(errorData.error || "Error al iniciar sesión")
      }

      // Intentar parsear la respuesta como JSON
      const data = await response.json().catch((err) => {
        console.error("Error parsing JSON response:", err)
        throw new Error("Error al procesar la respuesta del servidor")
      })

      console.log("Login response data:", data)

      // Verificar que la respuesta tenga el formato esperado
      if (!data.success || !data.token) {
        throw new Error("Respuesta inválida del servidor")
      }

      // Guardar el token en localStorage
      localStorage.setItem("token", data.token)

      // Guardar los datos del usuario en localStorage
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
      }

      // Redirigir a la página de ubicaciones
      router.push("/locations")
    } catch (err) {
      console.error("Login error:", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <span className="text-blue-600">SMART</span>
            <span className="text-gray-800">SPOT</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Inicia sesión como usuario</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="flex">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="+52" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+52">+52</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+44">+44</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Número de teléfono"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 ml-2"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlate">Placa</Label>
              <Input
                id="licensePlate"
                placeholder="ABC-123"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-center text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Regístrate aquí
            </Link>
          </p>
          <p className="text-sm text-center text-muted-foreground">
            <Link href="/admin/login" className="text-blue-600 hover:underline">
              Iniciar sesión como administrador
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

