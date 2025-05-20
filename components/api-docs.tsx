"use client"

import { useState, useEffect } from "react"
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Code, Server, Database, Lock } from "lucide-react"
import { openApiSpec } from "@/lib/openapi-spec"

export function ApiDocs() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("docs")
  const [customCss, setCustomCss] = useState("")

  useEffect(() => {
    // Aplicar estilos personalizados para el tema oscuro de Swagger UI
    const css = `
      .swagger-ui {
        font-family: ui-sans-serif, system-ui, sans-serif;
      }
      .swagger-ui .info .title {
        color: white;
        font-size: 36px;
        font-weight: bold;
      }
      .swagger-ui .info {
        margin: 30px 0;
      }
      .swagger-ui .info .title small.version-stamp {
        background-color: #3b82f6;
      }
      .swagger-ui .info .title small.version-stamp pre {
        color: white;
      }
      .swagger-ui .info .base-url {
        color: #94a3b8;
      }
      .swagger-ui .info a {
        color: #3b82f6;
      }
      .swagger-ui .scheme-container {
        background-color: #1e293b;
        box-shadow: none;
        border-radius: 8px;
        margin: 20px 0;
      }
      .swagger-ui .btn.authorize {
        background-color: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      .swagger-ui .btn.authorize svg {
        fill: white;
      }
      .swagger-ui .opblock-tag {
        color: white;
        font-size: 24px;
        margin: 10px 0;
        border-bottom: 1px solid #334155;
      }
      .swagger-ui .opblock {
        background-color: #1e293b;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        margin-bottom: 15px;
        border: none;
      }
      .swagger-ui .opblock .opblock-summary {
        padding: 10px;
      }
      .swagger-ui .opblock .opblock-summary-method {
        font-weight: bold;
        min-width: 80px;
        text-align: center;
      }
      .swagger-ui .opblock.opblock-get {
        background-color: rgba(14, 165, 233, 0.1);
        border-color: #0ea5e9;
      }
      .swagger-ui .opblock.opblock-post {
        background-color: rgba(34, 197, 94, 0.1);
        border-color: #22c55e;
      }
      .swagger-ui .opblock.opblock-put, .swagger-ui .opblock.opblock-patch {
        background-color: rgba(249, 115, 22, 0.1);
        border-color: #f97316;
      }
      .swagger-ui .opblock.opblock-delete {
        background-color: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
      }
      .swagger-ui .opblock-summary-path {
        color: #e2e8f0;
        font-family: ui-monospace, monospace;
      }
      .swagger-ui .opblock-summary-description {
        color: #94a3b8;
      }
      .swagger-ui .opblock-description-wrapper, .swagger-ui .opblock-external-docs-wrapper, .swagger-ui .opblock-title_normal {
        background-color: #1e293b;
        color: #e2e8f0;
      }
      .swagger-ui .opblock-description-wrapper p, .swagger-ui .opblock-external-docs-wrapper p, .swagger-ui .opblock-title_normal p {
        color: #e2e8f0;
      }
      .swagger-ui .opblock .opblock-section-header {
        background-color: #334155;
        border-radius: 4px;
        box-shadow: none;
      }
      .swagger-ui .opblock .opblock-section-header h4 {
        color: white;
      }
      .swagger-ui .opblock .opblock-section-header label {
        color: #e2e8f0;
      }
      .swagger-ui .parameters-container .parameters-col_description {
        color: #e2e8f0;
      }
      .swagger-ui .parameters-container .parameters-col_name {
        color: #94a3b8;
      }
      .swagger-ui table tbody tr td {
        color: #e2e8f0;
        border-bottom: 1px solid #334155;
      }
      .swagger-ui .response-col_status {
        color: #e2e8f0;
      }
      .swagger-ui .response-col_description {
        color: #e2e8f0;
      }
      .swagger-ui .response-col_links {
        color: #e2e8f0;
      }
      .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 {
        color: #e2e8f0;
      }
      .swagger-ui .model-title {
        color: #e2e8f0;
      }
      .swagger-ui .model {
        color: #e2e8f0;
      }
      .swagger-ui .model-toggle:after {
        background-color: #334155;
      }
      .swagger-ui section.models {
        background-color: #1e293b;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: none;
      }
      .swagger-ui section.models.is-open h4 {
        color: white;
        border-bottom: 1px solid #334155;
      }
      .swagger-ui .model-container {
        background-color: #1e293b;
        border-radius: 4px;
        border: 1px solid #334155;
      }
      .swagger-ui .model-box {
        background-color: #1e293b;
      }
      .swagger-ui .prop-type {
        color: #3b82f6;
      }
      .swagger-ui .prop-name {
        color: #e2e8f0;
      }
      .swagger-ui .prop-format {
        color: #94a3b8;
      }
      .swagger-ui .parameter__name {
        color: #e2e8f0;
      }
      .swagger-ui .parameter__type {
        color: #3b82f6;
      }
      .swagger-ui .parameter__in {
        color: #94a3b8;
      }
      .swagger-ui .parameter__deprecated {
        color: #ef4444;
      }
      .swagger-ui .topbar {
        display: none;
      }
      .swagger-ui .wrapper {
        padding: 0;
      }
      .swagger-ui .btn {
        box-shadow: none;
      }
      .swagger-ui .btn-group {
        padding: 10px 0;
      }
      .swagger-ui .try-out__btn {
        background-color: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      .swagger-ui .try-out__btn:hover {
        background-color: #2563eb;
      }
      .swagger-ui .execute-wrapper {
        padding: 15px 0;
      }
      .swagger-ui .execute {
        background-color: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      .swagger-ui .execute:hover {
        background-color: #2563eb;
      }
      .swagger-ui .highlight-code {
        background-color: #0f172a;
      }
      .swagger-ui .highlight-code .microlight {
        color: #e2e8f0;
        font-family: ui-monospace, monospace;
      }
      .swagger-ui .responses-table .response-col_status {
        color: #e2e8f0;
      }
      .swagger-ui .download-contents {
        color: #3b82f6;
      }
      .swagger-ui input[type=text], .swagger-ui textarea {
        background-color: #0f172a;
        color: #e2e8f0;
        border: 1px solid #334155;
        border-radius: 4px;
      }
      .swagger-ui select {
        background-color: #0f172a;
        color: #e2e8f0;
        border: 1px solid #334155;
        border-radius: 4px;
      }
      .swagger-ui .markdown p, .swagger-ui .markdown li, .swagger-ui .markdown h1, .swagger-ui .markdown h2, .swagger-ui .markdown h3, .swagger-ui .markdown h4, .swagger-ui .markdown h5, .swagger-ui .markdown h6 {
        color: #e2e8f0;
      }
      .swagger-ui .markdown code {
        color: #3b82f6;
        background-color: #0f172a;
        font-family: ui-monospace, monospace;
        padding: 2px 4px;
        border-radius: 4px;
      }
      .swagger-ui .servers-title {
        color: white;
      }
      .swagger-ui .servers > label {
        color: #e2e8f0;
      }
      .swagger-ui .servers > label select {
        background-color: #0f172a;
        color: #e2e8f0;
        border: 1px solid #334155;
        border-radius: 4px;
      }
    `
    setCustomCss(css)
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const curlExample = `curl -X GET "https://api.smartspot.com/locations" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"`

  const jsExample = `// Using fetch API
const fetchLocations = async () => {
  try {
    const response = await fetch('https://api.smartspot.com/locations', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    console.log('Locations:', data);
    return data;
  } catch (error) {
    console.error('Error fetching locations:', error);
  }
};

fetchLocations();`

  const pythonExample = `import requests

def get_locations():
    url = "https://api.smartspot.com/locations"
    headers = {
        "Authorization": "Bearer YOUR_TOKEN",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        
        data = response.json()
        print("Locations:", data)
        return data
    except requests.exceptions.RequestException as e:
        print("Error fetching locations:", e)
        
get_locations()`

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">SmartSpot Parking API</h1>
        <p className="text-gray-300 text-lg">
          Documentación completa de la API para el sistema de estacionamiento inteligente
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-blue-900/20 border-blue-700/50 p-4 flex flex-col items-center justify-center">
          <Server className="h-8 w-8 text-blue-400 mb-2" />
          <h3 className="text-lg font-medium text-white">Endpoints</h3>
          <p className="text-gray-300 text-center mt-1">Más de 20 endpoints documentados</p>
        </Card>
        <Card className="bg-green-900/20 border-green-700/50 p-4 flex flex-col items-center justify-center">
          <Database className="h-8 w-8 text-green-400 mb-2" />
          <h3 className="text-lg font-medium text-white">Modelos</h3>
          <p className="text-gray-300 text-center mt-1">Esquemas de datos detallados</p>
        </Card>
        <Card className="bg-purple-900/20 border-purple-700/50 p-4 flex flex-col items-center justify-center">
          <Code className="h-8 w-8 text-purple-400 mb-2" />
          <h3 className="text-lg font-medium text-white">Ejemplos</h3>
          <p className="text-gray-300 text-center mt-1">Código en múltiples lenguajes</p>
        </Card>
        <Card className="bg-amber-900/20 border-amber-700/50 p-4 flex flex-col items-center justify-center">
          <Lock className="h-8 w-8 text-amber-400 mb-2" />
          <h3 className="text-lg font-medium text-white">Autenticación</h3>
          <p className="text-gray-300 text-center mt-1">Seguridad con JWT</p>
        </Card>
      </div>

      <Tabs defaultValue="docs" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="docs">Documentación API</TabsTrigger>
          <TabsTrigger value="examples">Ejemplos de Código</TabsTrigger>
          <TabsTrigger value="auth">Guía de Autenticación</TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="mt-0">
          <Card className="border-gray-700 bg-gray-900/50">
            <style>{customCss}</style>
            <div className="swagger-wrapper">
              <SwaggerUI
                spec={openApiSpec}
                docExpansion="list"
                defaultModelsExpandDepth={1}
                displayRequestDuration={true}
                filter={true}
                showExtensions={true}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="examples" className="mt-0">
          <Card className="border-gray-700 bg-gray-900/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Ejemplos de Código</h2>
            <p className="text-gray-300 mb-6">
              Aquí encontrarás ejemplos de cómo interactuar con la API de SmartSpot Parking en diferentes lenguajes de
              programación.
            </p>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-white">cURL</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(curlExample)}
                  className="text-gray-300 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="bg-gray-800 rounded-md p-4 overflow-x-auto">
                <pre className="text-gray-300 font-mono text-sm">{curlExample}</pre>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-white">JavaScript</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(jsExample)}
                  className="text-gray-300 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="bg-gray-800 rounded-md p-4 overflow-x-auto">
                <pre className="text-gray-300 font-mono text-sm">{jsExample}</pre>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-white">Python</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(pythonExample)}
                  className="text-gray-300 hover:text-white"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="bg-gray-800 rounded-md p-4 overflow-x-auto">
                <pre className="text-gray-300 font-mono text-sm">{pythonExample}</pre>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="mt-0">
          <Card className="border-gray-700 bg-gray-900/50 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Guía de Autenticación</h2>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Autenticación con JWT</h3>
              <p className="text-gray-300 mb-4">
                SmartSpot Parking API utiliza tokens JWT (JSON Web Tokens) para autenticar las solicitudes. Sigue estos
                pasos para autenticarte:
              </p>

              <ol className="list-decimal list-inside text-gray-300 space-y-2 ml-4">
                <li>
                  Obtén un token de acceso mediante el endpoint{" "}
                  <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">/api/auth/login</code> o{" "}
                  <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">/api/auth/admin-login</code>
                </li>
                <li>Incluye el token en el encabezado de autorización de tus solicitudes</li>
                <li>
                  El formato del encabezado debe ser:{" "}
                  <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">Authorization: Bearer YOUR_TOKEN</code>
                </li>
              </ol>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Endpoints de Autenticación</h3>

              <div className="space-y-4">
                <div className="border border-gray-700 rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <Badge className="bg-green-600 text-white mr-2">POST</Badge>
                    <span className="text-white font-mono">/api/auth/login</span>
                  </div>
                  <p className="text-gray-300 mb-2">Inicia sesión como usuario regular</p>
                  <div className="bg-gray-800 rounded-md p-3 mb-2">
                    <p className="text-gray-300 font-semibold mb-1">Cuerpo de la solicitud:</p>
                    <pre className="text-gray-300 font-mono text-sm">{`{
  "phone": "+5218111234567",
  "licensePlate": "ABC123"
}`}</pre>
                  </div>
                  <div className="bg-gray-800 rounded-md p-3">
                    <p className="text-gray-300 font-semibold mb-1">Respuesta:</p>
                    <pre className="text-gray-300 font-mono text-sm">{`{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "phone": "+5218111234567",
    "licensePlate": "ABC123",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  }
}`}</pre>
                  </div>
                </div>

                <div className="border border-gray-700 rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <Badge className="bg-green-600 text-white mr-2">POST</Badge>
                    <span className="text-white font-mono">/api/auth/admin-login</span>
                  </div>
                  <p className="text-gray-300 mb-2">Inicia sesión como administrador</p>
                  <div className="bg-gray-800 rounded-md p-3 mb-2">
                    <p className="text-gray-300 font-semibold mb-1">Cuerpo de la solicitud:</p>
                    <pre className="text-gray-300 font-mono text-sm">{`{
  "username": "admin",
  "password": "your_password"
}`}</pre>
                  </div>
                  <div className="bg-gray-800 rounded-md p-3">
                    <p className="text-gray-300 font-semibold mb-1">Respuesta:</p>
                    <pre className="text-gray-300 font-mono text-sm">{`{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "admin_id",
    "username": "admin",
    "role": "ADMIN"
  }
}`}</pre>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Seguridad y Mejores Prácticas</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Los tokens JWT expiran después de 7 días</li>
                <li>Almacena los tokens de forma segura (por ejemplo, en localStorage o en una cookie segura)</li>
                <li>No incluyas tokens en URLs o en código fuente público</li>
                <li>Implementa un mecanismo para renovar tokens antes de que expiren</li>
                <li>Utiliza HTTPS para todas las comunicaciones con la API</li>
              </ul>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center text-gray-400">
        <p>© 2024 SmartSpot Parking. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}
