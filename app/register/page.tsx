"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Phone, Car } from "lucide-react"
import ParticlesBackground from "@/components/particles-background"
import { isValidPhone, isValidLicensePlate, isValidEmail } from "@/lib/validations"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+52",
    licensePlate: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.name.trim()) {
        throw new Error("Por favor ingrese su nombre completo")
      }

      if (!isValidEmail(formData.email)) {
        throw new Error("Por favor ingrese un correo electrónico válido")
      }

      const fullPhone = `${formData.countryCode}${formData.phoneNumber}`
      if (!isValidPhone(fullPhone)) {
        throw new Error("Por favor ingrese un número de teléfono válido")
      }

      if (!isValidLicensePlate(formData.licensePlate)) {
        throw new Error("Por favor ingrese una placa válida (entre 2 y 10 caracteres)")
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: fullPhone,
          licensePlate: formData.licensePlate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al registrar usuario")
      }

      router.push("/user-login?registered=true")
    } catch (err) {
      setError((err as Error).message || "Error al registrar usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ParticlesBackground color="#3b82f6" />

      <Card className="w-full max-w-md bg-black/90 backdrop-blur-sm shadow-xl text-white">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            <span className="text-blue-400">SMART</span>
            <span className="text-white">SPOT</span>
          </CardTitle>
          <CardDescription className="text-gray-400">Crea tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <Label htmlFor="name" className="text-gray-300">
                  Nombre Completo
                </Label>
              </div>
              <Input
                name="name"
                placeholder="Ingresa tu nombre"
                value={formData.name}
                onChange={handleChange}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <Label htmlFor="email" className="text-gray-300">
                  Correo Electrónico
                </Label>
              </div>
              <Input
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                <Label htmlFor="phone" className="text-gray-300">
                  Teléfono
                </Label>
              </div>
              <div className="flex">
                <Select
                  value={formData.countryCode}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, countryCode: value }))}
                >
                  <SelectTrigger className="w-24 bg-gray-800 border-gray-700 text-white rounded-r-none border-r-0">
                    <SelectValue placeholder="+52" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 text-white border-gray-700">
                    <SelectItem value="+52">+52</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+44">+44</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  name="phoneNumber"
                  type="tel"
                  placeholder="Número de teléfono"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="flex-1 bg-gray-800 border-gray-700 text-white rounded-l-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Car className="h-4 w-4 mr-2 text-gray-400" />
                <Label htmlFor="licensePlate" className="text-gray-300">
                  No. de Placa
                </Label>
              </div>
              <Input
                name="licensePlate"
                placeholder="Ingresa tu placa"
                value={formData.licensePlate}
                onChange={handleChange}
                className="uppercase bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="bg-red-900 border-red-700 text-white">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
              {loading ? "Procesando..." : "Continuar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center text-gray-400">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/user-login" className="text-blue-400 hover:underline">
              Iniciar sesión
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}