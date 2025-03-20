"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la página de inicio de sesión de usuario
    router.push("/user-login")
  }, [router])

  return null
}

