"use client"

import Link from "next/link"
import { FileText } from "lucide-react"

export function ApiDocsLink() {
  return (
    <Link
      href="/api-docs"
      className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      title="Documentación de API"
    >
      <FileText className="h-6 w-6" />
      <span className="sr-only">Documentación de API</span>
    </Link>
  )
}
