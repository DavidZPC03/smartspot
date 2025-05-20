"use client"

import { useEffect, useState } from "react"
// Eliminadas las importaciones de Swagger UI que causaban errores
import { openApiSpec } from "@/lib/openapi-spec"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Check, Server, Database, Code, Lock, ChevronRight, ChevronDown } from "lucide-react"

// Datos reales para ejemplos y pruebas
const realData = {
  users: [
    {
      id: "cm8gtzvl90000t30fi2usqg0o",
      name: "David Perez",
      email: "davidzpc03@gmail.com",
      phone: "+528673147831",
      licensePlate: "TEST001",
      createdAt: "2025-03-20 04:08:30.382",
      updatedAt: "2025-03-21 07:25:06.636",
      password: "TEST001",
      stripeCustomerId: "cus_RyxseKWb4PzJya",
    },
    {
      id: "cm8gu974i0031t30fdmst3g9x",
      name: "Test Guztavo",
      email: "test@admin.com",
      phone: "+528671269364",
      licensePlate: "TEST002",
      createdAt: "2025-03-20 04:15:45.234",
      updatedAt: "2025-03-20 04:15:45.234",
      password: "TEST002",
      stripeCustomerId: null,
    },
  ],
  locations: [
    {
      id: "cm8gu48eq000ct30fe6ef4itc",
      name: "Walmart Reforma Nvo Laredo",
      address: "Kiosco SC 3091, REFORMA, C. Lago de Chapala 5601, Infonavit Fundadores, 88275 Nuevo Laredo, Tamps.",
      createdAt: "2025-03-20 04:11:53.558",
      updatedAt: "2025-03-20 04:11:53.558",
      latitude: null,
      longitude: null,
      totalSpots: 60,
    },
    {
      id: "cm8gu72t40021t30fhv6flw56",
      name: "S-Mart Campeche",
      address: "Calle Quetzalcóatl 3246, Riveras del Bravo, 88240 Nuevo Laredo, Tamps.",
      createdAt: "2025-03-20 04:14:06.27",
      updatedAt: "2025-03-20 04:14:06.27",
      latitude: null,
      longitude: null,
      totalSpots: 35,
    },
  ],
  parkingSpots: [
    {
      id: "cm8gu48gj000dt30f5t1vnn8h",
      spotNumber: 1,
      locationId: "cm8gu48eq000ct30fe6ef4itc",
      createdAt: "2025-03-20 04:11:53.683",
      updatedAt: "2025-03-25 17:43:59.787",
      isAvailable: true,
      price: 45.5,
      isActive: true,
    },
    {
      id: "cm8gu48gj000et30fmbg2fxr4",
      spotNumber: 2,
      locationId: "cm8gu48eq000ct30fe6ef4itc",
      createdAt: "2025-03-20 04:11:53.683",
      updatedAt: "2025-03-20 04:11:53.683",
      isAvailable: true,
      price: 20,
      isActive: true,
    },
  ],
  reservations: [
    {
      id: "cm8igj8hz000cp00fng9fdoca",
      parkingSpotId: "cm8igdsw30001p00fu5hhavby",
      startTime: "2025-03-21 07:26:57.551",
      endTime: "2025-03-21 09:26:57.551",
      qrCode: "CC8D01D6508F",
      createdAt: "2025-03-21 07:27:11.304",
      updatedAt: "2025-03-21 07:27:11.304",
      paymentId: "pi_3R4zypJKTyvYF0td0bG5GaHK",
      paymentMethod: "stripe",
      price: 20,
      status: "confirmed",
      stripePaymentIntentId: "pi_3R4zypJKTyvYF0td0bG5GaHK",
      stripePaymentStatus: "succeeded",
      userId: "cm8gtzvl90000t30fi2usqg0o",
      timerStarted: false,
      timerStartedAt: null,
    },
  ],
}

// IDs simplificados para pruebas
const simplifiedIds = {
  userId: "user123",
  locationId: "loc123",
  parkingSpotId: "spot123",
  reservationId: "res123",
}

export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState<string | null>("general")
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [testResponses, setTestResponses] = useState<Record<string, any>>({})
  const [testLoading, setTestLoading] = useState<Record<string, boolean>>({})
  const [testParams, setTestParams] = useState<Record<string, Record<string, string>>>({})
  const [testHeaders, setTestHeaders] = useState<Record<string, Record<string, string>>>({})
  const [testBody, setTestBody] = useState<Record<string, string>>({})
  // Eliminada la referencia a Swagger UI

  useEffect(() => {
    // Inicializar parámetros de prueba con datos reales
    const initialParams: Record<string, Record<string, string>> = {}
    const initialHeaders: Record<string, Record<string, string>> = {}
    const initialBody: Record<string, string> = {}

    Object.entries(openApiSpec.paths).forEach(([path, methods]) => {
      Object.entries(methods as Record<string, any>).forEach(([method, details]) => {
        const endpointId = `${method}-${path}`
        initialParams[endpointId] = {}
        initialHeaders[endpointId] = {
          "Content-Type": "application/json",
          Authorization: "Bearer YOUR_TOKEN",
        }

        // Usar datos reales para los cuerpos de solicitud
        if (details.requestBody?.content?.["application/json"]?.example) {
          let exampleBody = { ...details.requestBody.content["application/json"].example }

          // Reemplazar con datos reales según el endpoint
          if (path.includes("/auth/login")) {
            exampleBody = {
              phone: realData.users[0].phone,
              licensePlate: realData.users[0].licensePlate,
            }
          } else if (path.includes("/auth/register")) {
            exampleBody = {
              name: "Nuevo Usuario",
              email: "nuevo@ejemplo.com",
              phone: "+528671234567",
              licensePlate: "ABC123",
            }
          } else if (path.includes("/reservations") && method.toLowerCase() === "post") {
            exampleBody = {
              parkingSpotId: realData.parkingSpots[0].id,
              startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hora en el futuro
              endTime: new Date(Date.now() + 7200000).toISOString(), // 2 horas en el futuro
            }
          }

          initialBody[endpointId] = JSON.stringify(exampleBody, null, 2)
        } else {
          initialBody[endpointId] = ""
        }

        // Usar datos reales para los parámetros de ruta
        if (details.parameters) {
          details.parameters.forEach((param: any) => {
            if (param.in === "path") {
              if (param.name === "id" && path.includes("/locations/")) {
                initialParams[endpointId][param.name] = realData.locations[0].id
              } else if (param.name === "id" && path.includes("/parking-spots/")) {
                initialParams[endpointId][param.name] = realData.parkingSpots[0].id
              } else if (param.name === "id" && path.includes("/reservations/")) {
                initialParams[endpointId][param.name] = realData.reservations[0].id
              } else if (param.name === "id" && path.includes("/users/")) {
                initialParams[endpointId][param.name] = realData.users[0].id
              } else if (param.name === "locationId") {
                initialParams[endpointId][param.name] = realData.locations[0].id
              } else if (param.name === "spotId") {
                initialParams[endpointId][param.name] = realData.parkingSpots[0].id
              } else {
                initialParams[endpointId][param.name] = ""
              }
            } else if (param.in === "query") {
              initialParams[endpointId][param.name] = ""
            }
          })
        }
      })
    })

    setTestParams(initialParams)
    setTestHeaders(initialHeaders)
    setTestBody(initialBody)

    // Aplicar estilos personalizados para el tema oscuro
    const style = document.createElement("style")
    style.innerHTML = `
      /* Tema oscuro para Swagger UI */
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
      
      /* Ocultar Swagger UI para mostrar nuestra interfaz personalizada */
      #swagger-ui {
        display: none;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied((prev) => ({
      ...prev,
      [id]: true,
    }))
    setTimeout(() => {
      setCopied((prev) => ({
        ...prev,
        [id]: false,
      }))
    }, 2000)
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-600"
      case "POST":
        return "bg-green-600"
      case "PUT":
        return "bg-amber-600"
      case "PATCH":
        return "bg-orange-600"
      case "DELETE":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const handleParamChange = (endpointId: string, paramName: string, value: string) => {
    setTestParams((prev) => ({
      ...prev,
      [endpointId]: {
        ...prev[endpointId],
        [paramName]: value,
      },
    }))
  }

  const handleHeaderChange = (endpointId: string, headerName: string, value: string) => {
    setTestHeaders((prev) => ({
      ...prev,
      [endpointId]: {
        ...prev[endpointId],
        [headerName]: value,
      },
    }))
  }

  const handleBodyChange = (endpointId: string, value: string) => {
    setTestBody((prev) => ({
      ...prev,
      [endpointId]: value,
    }))
  }

  const testEndpoint = async (path: string, method: string, endpointId: string) => {
    try {
      setTestLoading((prev) => ({ ...prev, [endpointId]: true }))

      // Reemplazar parámetros de ruta
      let url = `${window.location.origin}${path}`
      const pathParams = Object.entries(testParams[endpointId] || {}).filter(([name]) => path.includes(`{${name}}`))

      pathParams.forEach(([name, value]) => {
        url = url.replace(`{${name}}`, encodeURIComponent(value))
      })

      // Añadir parámetros de consulta
      const queryParams = Object.entries(testParams[endpointId] || {}).filter(([name]) => !path.includes(`{${name}}`))
      if (queryParams.length > 0) {
        const queryString = queryParams
          .filter(([_, value]) => value)
          .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
          .join("&")
        if (queryString) {
          url += `?${queryString}`
        }
      }

      // Preparar opciones de fetch
      const options: RequestInit = {
        method: method.toUpperCase(),
        headers: testHeaders[endpointId] || {},
      }

      // Añadir cuerpo si es necesario
      if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && testBody[endpointId]) {
        options.body = testBody[endpointId]
      }

      // Realizar la solicitud
      const response = await fetch(url, options)
      const contentType = response.headers.get("content-type") || ""

      let data
      if (contentType.includes("application/json")) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      setTestResponses((prev) => ({
        ...prev,
        [endpointId]: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data,
        },
      }))
    } catch (error) {
      setTestResponses((prev) => ({
        ...prev,
        [endpointId]: {
          error: error instanceof Error ? error.message : "Error desconocido",
        },
      }))
    } finally {
      setTestLoading((prev) => ({ ...prev, [endpointId]: false }))
    }
  }

  const renderEndpointsForTag = (tag: string) => {
    const endpointsForTag: JSX.Element[] = []

    Object.entries(openApiSpec.paths).forEach(([path, methods]) => {
      Object.entries(methods as Record<string, any>).forEach(([method, details]) => {
        if (details.tags && details.tags.includes(tag)) {
          const endpointId = `${method}-${path}`
          const isExpanded = expandedItems[endpointId] || false
          const methodColor = getMethodColor(method)

          endpointsForTag.push(
            <div key={endpointId} className="mb-4 border border-gray-700 rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50"
                onClick={() => toggleItem(endpointId)}
              >
                <div className="flex items-center space-x-3">
                  <Badge className={`${methodColor} text-white uppercase`}>{method}</Badge>
                  <span className="text-white font-mono">{path}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 text-sm mr-2">{details.summary}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-700 p-4 bg-gray-800/30">
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-white mb-2">Descripción</h4>
                    <p className="text-gray-300">{details.description}</p>
                  </div>

                  {/* Sección de prueba del endpoint */}
                  <div className="mb-6 border border-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-4">Probar Endpoint</h4>

                    {/* Parámetros */}
                    {details.parameters && details.parameters.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-md font-medium text-white mb-2">Parámetros</h5>
                        <div className="space-y-2">
                          {details.parameters.map((param: any, index: number) => (
                            <div key={index} className="flex flex-col">
                              <label className="text-gray-300 mb-1">
                                {param.name}
                                {param.required && <span className="text-red-500 ml-1">*</span>}
                                <span className="text-gray-500 ml-2">({param.in})</span>
                              </label>
                              <input
                                type="text"
                                value={testParams[endpointId]?.[param.name] || ""}
                                onChange={(e) => handleParamChange(endpointId, param.name, e.target.value)}
                                placeholder={param.description}
                                className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                              />
                              {param.description && <p className="text-gray-500 text-sm mt-1">{param.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Headers */}
                    <div className="mb-4">
                      <h5 className="text-md font-medium text-white mb-2">Headers</h5>
                      <div className="space-y-2">
                        {Object.entries(testHeaders[endpointId] || {}).map(([headerName, headerValue]) => (
                          <div key={headerName} className="flex flex-col">
                            <label className="text-gray-300 mb-1">{headerName}</label>
                            <input
                              type="text"
                              value={headerValue}
                              onChange={(e) => handleHeaderChange(endpointId, headerName, e.target.value)}
                              className="bg-gray-800 border border-gray-700 rounded-md p-2 text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Body (solo para POST, PUT, PATCH) */}
                    {["post", "put", "patch"].includes(method.toLowerCase()) && (
                      <div className="mb-4">
                        <h5 className="text-md font-medium text-white mb-2">Body</h5>
                        <textarea
                          value={testBody[endpointId] || ""}
                          onChange={(e) => handleBodyChange(endpointId, e.target.value)}
                          rows={5}
                          className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 text-white font-mono"
                        />
                      </div>
                    )}

                    {/* Botón de ejecución */}
                    <Button
                      onClick={() => testEndpoint(path, method, endpointId)}
                      disabled={testLoading[endpointId]}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {testLoading[endpointId] ? "Ejecutando..." : "Ejecutar"}
                    </Button>

                    {/* Respuesta */}
                    {testResponses[endpointId] && (
                      <div className="mt-4">
                        <h5 className="text-md font-medium text-white mb-2">Respuesta</h5>
                        {testResponses[endpointId].error ? (
                          <div className="bg-red-900/30 border border-red-700 rounded-md p-3">
                            <p className="text-red-400">{testResponses[endpointId].error}</p>
                          </div>
                        ) : (
                          <div className="bg-gray-800 border border-gray-700 rounded-md p-3">
                            <div className="flex items-center mb-2">
                              <Badge
                                className={`${
                                  testResponses[endpointId].status < 300
                                    ? "bg-green-600"
                                    : testResponses[endpointId].status < 400
                                      ? "bg-blue-600"
                                      : testResponses[endpointId].status < 500
                                        ? "bg-amber-600"
                                        : "bg-red-600"
                                } text-white mr-2`}
                              >
                                {testResponses[endpointId].status}
                              </Badge>
                              <span className="text-gray-300">{testResponses[endpointId].statusText}</span>
                            </div>
                            <pre className="text-gray-300 font-mono text-sm overflow-x-auto mt-2">
                              {typeof testResponses[endpointId].data === "object"
                                ? JSON.stringify(testResponses[endpointId].data, null, 2)
                                : testResponses[endpointId].data}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {details.parameters && details.parameters.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-lg font-medium text-white mb-2">Parámetros</h4>
                      <div className="bg-gray-800 rounded-md p-3 overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-gray-300">Nombre</th>
                              <th className="px-4 py-2 text-left text-gray-300">Ubicación</th>
                              <th className="px-4 py-2 text-left text-gray-300">Tipo</th>
                              <th className="px-4 py-2 text-left text-gray-300">Requerido</th>
                              <th className="px-4 py-2 text-left text-gray-300">Descripción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.parameters.map((param: any, index: number) => (
                              <tr key={index} className="border-t border-gray-700">
                                <td className="px-4 py-2 text-blue-400 font-mono">{param.name}</td>
                                <td className="px-4 py-2 text-gray-300">{param.in}</td>
                                <td className="px-4 py-2 text-gray-300">
                                  {param.schema?.type || param.schema?.$ref?.split("/").pop() || "object"}
                                </td>
                                <td className="px-4 py-2 text-gray-300">{param.required ? "Sí" : "No"}</td>
                                <td className="px-4 py-2 text-gray-300">{param.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {details.requestBody && (
                    <div className="mb-4">
                      <h4 className="text-lg font-medium text-white mb-2">Cuerpo de la Solicitud</h4>
                      <div className="bg-gray-800 rounded-md p-3">
                        <p className="text-gray-300 mb-2">
                          Tipo de contenido: <code className="text-blue-400">application/json</code>
                        </p>
                        {details.requestBody.content?.["application/json"]?.schema && (
                          <div className="mb-2">
                            <p className="text-gray-300 mb-1">Esquema:</p>
                            {details.requestBody.content["application/json"].schema.$ref ? (
                              <p className="text-blue-400 font-mono">
                                {details.requestBody.content["application/json"].schema.$ref.split("/").pop()}
                              </p>
                            ) : (
                              <pre className="text-gray-300 font-mono text-sm overflow-x-auto">
                                {JSON.stringify(details.requestBody.content["application/json"].schema, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                        {details.requestBody.content?.["application/json"]?.example && (
                          <div>
                            <p className="text-gray-300 mb-1">Ejemplo:</p>
                            <pre className="text-gray-300 font-mono text-sm overflow-x-auto">
                              {JSON.stringify(details.requestBody.content["application/json"].example, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-white mb-2">Respuestas</h4>
                    <div className="space-y-3">
                      {Object.entries(details.responses).map(([code, response]: [string, any]) => (
                        <div key={code} className="bg-gray-800 rounded-md p-3">
                          <div className="flex items-center mb-2">
                            <Badge
                              className={`${
                                code.startsWith("2")
                                  ? "bg-green-600"
                                  : code.startsWith("4")
                                    ? "bg-amber-600"
                                    : "bg-red-600"
                              } text-white mr-2`}
                            >
                              {code}
                            </Badge>
                            <span className="text-gray-300">{response.description}</span>
                          </div>
                          {response.content?.["application/json"]?.schema && (
                            <div className="mb-2">
                              <p className="text-gray-300 mb-1">Esquema:</p>
                              {response.content["application/json"].schema.$ref ? (
                                <p className="text-blue-400 font-mono">
                                  {response.content["application/json"].schema.$ref.split("/").pop()}
                                </p>
                              ) : (
                                <pre className="text-gray-300 font-mono text-sm overflow-x-auto">
                                  {JSON.stringify(response.content["application/json"].schema, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}
                          {response.content?.["application/json"]?.example && (
                            <div>
                              <p className="text-gray-300 mb-1">Ejemplo:</p>
                              <pre className="text-gray-300 font-mono text-sm overflow-x-auto">
                                {JSON.stringify(response.content["application/json"].example, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Ejemplo de Solicitud</h4>
                    <div className="bg-gray-800 rounded-md p-3 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">cURL</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `curl -X ${method.toUpperCase()} "https://api.smartspot.com${path}" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"${
    details.requestBody?.content?.["application/json"]?.example
      ? ` \\
  -d '${JSON.stringify(details.requestBody.content["application/json"].example)}'`
      : ""
  }`,
                              `curl-${endpointId}`,
                            )
                          }
                          className="text-gray-300 hover:text-white"
                        >
                          {copied[`curl-${endpointId}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <pre className="text-gray-300 font-mono text-sm overflow-x-auto">
                        {`curl -X ${method.toUpperCase()} "https://api.smartspot.com${path}" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"${
    details.requestBody?.content?.["application/json"]?.example
      ? ` \\
  -d '${JSON.stringify(details.requestBody.content["application/json"].example)}'`
      : ""
  }`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>,
          )
        }
      })
    })

    return endpointsForTag
  }

  const renderModels = () => {
    return Object.entries(openApiSpec.components.schemas).map(([modelName, schema]: [string, any]) => {
      const isExpanded = expandedItems[`model-${modelName}`] || false

      // Obtener datos reales para el ejemplo
      let exampleData = {}
      if (modelName === "User" && realData.users.length > 0) {
        exampleData = { ...realData.users[0] }
        // Eliminar campos sensibles
        delete (exampleData as any).password
      } else if (modelName === "Location" && realData.locations.length > 0) {
        exampleData = { ...realData.locations[0] }
      } else if (modelName === "ParkingSpot" && realData.parkingSpots.length > 0) {
        exampleData = { ...realData.parkingSpots[0] }
      } else if (modelName === "Reservation" && realData.reservations.length > 0) {
        exampleData = { ...realData.reservations[0] }
      }

      return (
        <div key={modelName} className="mb-4 border border-gray-700 rounded-lg overflow-hidden">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50"
            onClick={() => toggleItem(`model-${modelName}`)}
          >
            <div className="flex items-center">
              <span className="text-white font-mono text-lg">{modelName}</span>
            </div>
            <div>
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          {isExpanded && (
            <div className="border-t border-gray-700 p-4 bg-gray-800/30">
              {schema.description && (
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-white mb-2">Descripción</h4>
                  <p className="text-gray-300">{schema.description}</p>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-lg font-medium text-white mb-2">Propiedades</h4>
                <div className="bg-gray-800 rounded-md p-3 overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-300">Nombre</th>
                        <th className="px-4 py-2 text-left text-gray-300">Tipo</th>
                        <th className="px-4 py-2 text-left text-gray-300">Requerido</th>
                        <th className="px-4 py-2 text-left text-gray-300">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schema.properties &&
                        Object.entries(schema.properties).map(([propName, propSchema]: [string, any]) => (
                          <tr key={propName} className="border-t border-gray-700">
                            <td className="px-4 py-2 text-blue-400 font-mono">{propName}</td>
                            <td className="px-4 py-2 text-gray-300">
                              {propSchema.type || propSchema.$ref?.split("/").pop() || "object"}
                              {propSchema.format && <span className="text-gray-500 ml-1">({propSchema.format})</span>}
                            </td>
                            <td className="px-4 py-2 text-gray-300">
                              {schema.required?.includes(propName) ? "Sí" : "No"}
                            </td>
                            <td className="px-4 py-2 text-gray-300">{propSchema.description || "-"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-white mb-2">Ejemplo (Datos Reales)</h4>
                <div className="bg-gray-800 rounded-md p-3">
                  <pre className="text-gray-300 font-mono text-sm overflow-x-auto">
                    {JSON.stringify(exampleData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-gray-900/80 border border-gray-700 rounded-lg overflow-hidden sticky top-4">
              <div
                className={`p-4 cursor-pointer ${
                  activeSection === "general" ? "bg-blue-900/30" : "hover:bg-gray-800/50"
                }`}
                onClick={() => toggleSection("general")}
              >
                <h3 className="text-white font-medium">Información General</h3>
              </div>
              <div
                className={`p-4 cursor-pointer ${
                  activeSection === "endpoints" ? "bg-blue-900/30" : "hover:bg-gray-800/50"
                }`}
                onClick={() => toggleSection("endpoints")}
              >
                <h3 className="text-white font-medium">Endpoints</h3>
              </div>
              <div
                className={`p-4 cursor-pointer ${
                  activeSection === "models" ? "bg-blue-900/30" : "hover:bg-gray-800/50"
                }`}
                onClick={() => toggleSection("models")}
              >
                <h3 className="text-white font-medium">Modelos</h3>
              </div>
              <div
                className={`p-4 cursor-pointer ${activeSection === "auth" ? "bg-blue-900/30" : "hover:bg-gray-800/50"}`}
                onClick={() => toggleSection("auth")}
              >
                <h3 className="text-white font-medium">Guía de Autenticación</h3>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="flex-grow">
            {activeSection === "general" && (
              <Card className="border-gray-700 bg-gray-900/50 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Información General de la API</h2>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Descripción</h3>
                  <p className="text-gray-300 mb-4">{openApiSpec.info.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-white mb-2">Versión</h4>
                      <p className="text-gray-300">{openApiSpec.info.version}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-lg font-medium text-white mb-2">Licencia</h4>
                      <p className="text-gray-300">
                        {openApiSpec.info.license.name} -{" "}
                        <a
                          href={openApiSpec.info.license.url}
                          className="text-blue-400 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver licencia
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Servidores</h3>
                  <div className="space-y-3">
                    {openApiSpec.servers.map((server: any, index: number) => (
                      <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-1">{server.description}</h4>
                        <p className="text-blue-400 font-mono">{server.url}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Categorías de Endpoints</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {openApiSpec.tags.map((tag: any, index: number) => (
                      <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-lg font-medium text-white mb-1">{tag.name}</h4>
                        <p className="text-gray-300">{tag.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {activeSection === "endpoints" && (
              <Card className="border-gray-700 bg-gray-900/50 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Endpoints de la API</h2>
                <p className="text-gray-300 mb-6">
                  Haz clic en cualquier categoría para ver los endpoints disponibles. Luego, haz clic en un endpoint
                  específico para ver detalles, parámetros, ejemplos de solicitud y respuestas.
                </p>

                <div className="space-y-6">
                  {openApiSpec.tags.map((tag: any) => {
                    const isExpanded = expandedItems[`tag-${tag.name}`] || false
                    return (
                      <div key={tag.name} className="border border-gray-700 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/50"
                          onClick={() => toggleItem(`tag-${tag.name}`)}
                        >
                          <h3 className="text-xl font-semibold text-white">{tag.name}</h3>
                          <div className="flex items-center">
                            <span className="text-gray-400 text-sm mr-2">{tag.description}</span>
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="border-t border-gray-700 p-4 bg-gray-800/30">
                            <div className="space-y-4">{renderEndpointsForTag(tag.name)}</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            {activeSection === "models" && (
              <Card className="border-gray-700 bg-gray-900/50 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Modelos de Datos</h2>
                <p className="text-gray-300 mb-6">
                  Haz clic en cualquier modelo para ver sus propiedades, tipos de datos y ejemplos con datos reales.
                </p>

                <div className="space-y-4">{renderModels()}</div>
              </Card>
            )}

            {activeSection === "auth" && (
              <Card className="border-gray-700 bg-gray-900/50 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Guía de Autenticación</h2>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Autenticación con JWT</h3>
                  <p className="text-gray-300 mb-4">
                    SmartSpot Parking API utiliza tokens JWT (JSON Web Tokens) para autenticar las solicitudes. Sigue
                    estos pasos para autenticarte:
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
                      <code className="bg-gray-800 px-2 py-1 rounded text-blue-400">
                        Authorization: Bearer YOUR_TOKEN
                      </code>
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
  "phone": "${realData.users[0].phone}",
  "licensePlate": "${realData.users[0].licensePlate}"
}`}</pre>
                      </div>
                      <div className="bg-gray-800 rounded-md p-3">
                        <p className="text-gray-300 font-semibold mb-1">Respuesta:</p>
                        <pre className="text-gray-300 font-mono text-sm">{`{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "${realData.users[0].id}",
    "phone": "${realData.users[0].phone}",
    "licensePlate": "${realData.users[0].licensePlate}",
    "name": "${realData.users[0].name}",
    "email": "${realData.users[0].email}"
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
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400">
          <p>© 2024 SmartSpot Parking. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
