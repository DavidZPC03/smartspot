import { type NextRequest, NextResponse } from "next/server"
import fs from "node:fs"
import path from "node:path"

export async function GET(request: NextRequest) {
  try {
    const publicDir = path.join(process.cwd(), "public")

    // Lista de archivos a verificar
    const filesToCheck = ["icon-192x192.png", "icon-512x512.png", "favicon.ico", "manifest.json"]

    const results = {}

    // Verificar cada archivo
    for (const file of filesToCheck) {
      const filePath = path.join(publicDir, file)
      results[file] = {
        exists: fs.existsSync(filePath),
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
      }
    }

    // Verificar el contenido del manifest.json
    let manifestContent = null
    const manifestPath = path.join(publicDir, "manifest.json")

    if (fs.existsSync(manifestPath)) {
      try {
        const rawManifest = fs.readFileSync(manifestPath, "utf8")
        manifestContent = JSON.parse(rawManifest)
      } catch (e) {
        manifestContent = { error: "Error parsing manifest.json" }
      }
    }

    return NextResponse.json({
      status: "success",
      files: results,
      manifest: manifestContent,
      baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
    })
  } catch (error) {
    console.error("Error checking manifest files:", error)
    return NextResponse.json(
      {
        error: "Error al verificar archivos del manifest",
        details: (error as Error).message,
        status: "error",
      },
      { status: 500 },
    )
  }
}

