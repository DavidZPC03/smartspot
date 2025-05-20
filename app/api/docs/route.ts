import { NextResponse } from "next/server"
import { openApiSpec } from "@/lib/openapi-spec"

// Esta ruta permite acceder a la especificación OpenAPI como JSON
// Útil para herramientas que consumen la especificación directamente
export async function GET() {
  return NextResponse.json(openApiSpec)
}
