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
import { isValidEmail, isValidPhone, isValidLicensePlate, isValidName } from "@/lib/validations"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [countryCode, setCountryCode] = useState("+52")
  const [plate, setPlate] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Actualizar la función handleSubmit para incluir validaciones
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validar que todos los campos requeridos estén completos
    if (!name || !phone || !plate) {
      setError("Por favor complete todos los campos requeridos")
      setLoading(false)
      return
    }

    // Validar nombre
    if (!isValidName(name)) {
      setError("El nombre debe tener entre 2 y 100 caracteres")
      setLoading(false)
      return
    }

    // Validar formato de email si se proporciona
    if (email && !isValidEmail(email)) {
      setError("Por favor ingrese un correo electrónico válido")
      setLoading(false)
      return
    }

    // Validar formato de teléfono
    const fullPhone = `${countryCode}${phone}`
    if (!isValidPhone(fullPhone)) {
      setError("Por favor ingrese un número de teléfono válido")
      setLoading(false)
      return
    }

    // Validar formato de placa
    if (!isValidLicensePlate(plate)) {
      setError("Por favor ingrese una placa válida (entre 2 y 10 caracteres)")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone: fullPhone,
          licensePlate: plate,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error de servidor" }))
        throw new Error(errorData.error || "Error al registrar usuario")
      }

      const data = await response.json()

      // Guardar el token en localStorage
      if (data.token) {
        localStorage.setItem("token", data.token)
      }

      // Guardar los datos del usuario en localStorage
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
      }

      // Registration successful, redirect to locations page
      router.push("/locations")
    } catch (err) {
      setError((err as Error).message)
      console.error("Registration error:", err)
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
          <p className="text-sm text-muted-foreground">Registro de nuevo usuario</p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ingresa tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Correo Electrónico <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Necesario para recibir confirmaciones de reserva</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Teléfono <span className="text-red-500">*</span>
              </Label>
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 ml-2"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">
                No. de Placa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="plate"
                placeholder="Ingresa tu placa"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full py-6" size="lg" disabled={loading}>
              {loading ? "Procesando..." : "Continuar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/user-login" className="text-blue-600 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

