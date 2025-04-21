import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </ThemeProvider>
  )
}
