"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, Car, ShieldCheck } from "lucide-react"
import ParticlesBackground from "@/components/particles-background"
import Cookies from "js-cookie"

export default function UserLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/locations"

  const [phone, setPhone] = useState("")
  const [licensePlate, setLicensePlate] = useState("")
  const [countryCode, setCountryCode] = useState("+52")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Limpiar cookies existentes para evitar problemas
      Cookies.remove("token")
      localStorage.removeItem("token")

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: `${countryCode}${phone}`,
          licensePlate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión")
      }

      // Guardar token en localStorage
      localStorage.setItem("token", data.token)

      // Guardar token en cookie para el middleware
      Cookies.set("token", data.token, { path: "/", expires: 7 }) // Expira en 7 días

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
      }

      // Redirigir a la página principal o a la ruta especificada
      router.push(redirectPath)
    } catch (err) {
      console.error("Error logging in:", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ParticlesBackground color="#3b82f6" />

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl">
        <div className="text-center p-6 pb-2">
          <h1 className="text-2xl font-bold">
            <span className="text-blue-600">SMART</span>
            <span>SPOT</span>
          </h1>
          <p className="text-sm text-gray-600 mt-1">Inicia sesión como usuario</p>
        </div>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                <Label htmlFor="phone">Teléfono</Label>
              </div>
              <div className="flex">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="px-2 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-sm w-24">
                    <SelectValue placeholder="+52" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+52">+52</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+34">+34</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Número de teléfono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-l-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Car className="h-4 w-4 mr-2 text-gray-500" />
                <Label htmlFor="licensePlate">Placa</Label>
              </div>
              <Input
                id="licensePlate"
                placeholder="Número de placa"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                className="uppercase"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-600">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Regístrate aquí
            </Link>
          </div>
          <div className="text-xs text-center text-gray-500">
            <Link href="/admin/login" className="hover:underline flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Iniciar sesión como administrador
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

