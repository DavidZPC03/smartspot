"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { ThemeProvider } from "@/components/theme-provider"
import Cookies from "js-cookie"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Limpiar cookies existentes para evitar problemas
    Cookies.remove("adminToken")
    localStorage.removeItem("adminToken")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("Submitting admin login with:", { email })

      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      console.log("Admin login response status:", response.status)

      // Si la respuesta no es exitosa, mostrar el error
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error de servidor" }))
        throw new Error(errorData.error || "Error al iniciar sesión")
      }

      // Intentar parsear la respuesta como JSON
      const data = await response.json().catch((err) => {
        console.error("Error parsing JSON response:", err)
        throw new Error("Error al procesar la respuesta del servidor")
      })

      console.log("Admin login response data:", data)

      // Verificar que la respuesta tenga el formato esperado
      if (!data.success || !data.token) {
        throw new Error("Respuesta inválida del servidor")
      }

      // Guardar el token en localStorage
      localStorage.setItem("adminToken", data.token)
      console.log("Admin token stored in localStorage:", data.token.substring(0, 10) + "...")

      // Guardar el token en una cookie para que el middleware pueda acceder a él
      Cookies.set("adminToken", data.token, { path: "/", expires: 1 }) // Expira en 1 día

      // Guardar los datos del usuario en localStorage
      if (data.admin) {
        localStorage.setItem("admin", JSON.stringify(data.admin))
      }

      // Esperar un momento antes de redirigir
      setTimeout(() => {
        // Redirigir al dashboard de administrador
        console.log("Redirecting to dashboard...")
        router.push("/admin/dashboard")
      }, 500)
    } catch (err) {
      console.error("Admin login error:", err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="flex min-h-screen flex-col items-center justify-center linear-gradient-bg p-4">
        <Card className="linear-card w-full max-w-md border-0">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl font-bold">SMARTSPOT ADMIN</CardTitle>
            <p className="text-sm text-muted-foreground">Inicia sesión como administrador</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@smartspot.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="linear-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="linear-input"
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full linear-button linear-button-primary" disabled={loading}>
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              <Link href="/user-login" className="text-primary hover:underline">
                Iniciar sesión como usuario
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </ThemeProvider>
  )
}

