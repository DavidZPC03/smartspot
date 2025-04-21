"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"

interface ThemeToggleProps {
  className?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ThemeToggle({ className = "", variant = "outline", size = "icon" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true)
    // Set theme to light by default
    setTheme("light")
  }, [setTheme])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={className}
      title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
    >
      {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="sr-only">{theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}</span>
    </Button>
  )
}
