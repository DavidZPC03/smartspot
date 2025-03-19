"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [countryCode, setCountryCode] = useState("+52")
  const [plate, setPlate] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone: `${countryCode}${phone}`,
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
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                placeholder="Ingresa tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 ml-2"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">No. de Placa</Label>
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
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/user-login" className="text-blue-600 hover:underline">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

