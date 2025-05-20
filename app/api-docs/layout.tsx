import type React from "react"

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="api-docs-layout min-h-screen bg-gray-900">{children}</div>
}
