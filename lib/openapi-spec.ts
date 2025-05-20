export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "SmartSpot Parking API",
    description: "API para el sistema de estacionamiento inteligente SmartSpot",
    version: "1.0.0",
    contact: {
      name: "Soporte SmartSpot",
      email: "support@smartspot.com",
      url: "https://smartspot.com/support",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "https://api.smartspot.com",
      description: "Servidor de producción",
    },
    {
      url: "https://staging-api.smartspot.com",
      description: "Servidor de pruebas",
    },
    {
      url: "http://localhost:3000",
      description: "Servidor de desarrollo local",
    },
  ],
  tags: [
    {
      name: "Autenticación",
      description: "Endpoints para autenticación de usuarios y administradores",
    },
    {
      name: "Ubicaciones",
      description: "Gestión de ubicaciones de estacionamiento",
    },
    {
      name: "Espacios de Estacionamiento",
      description: "Gestión de espacios individuales dentro de las ubicaciones",
    },
    {
      name: "Reservaciones",
      description: "Creación y gestión de reservaciones de estacionamiento",
    },
    {
      name: "Usuarios",
      description: "Gestión de usuarios del sistema",
    },
    {
      name: "Pagos",
      description: "Procesamiento y gestión de pagos",
    },
    {
      name: "Admin",
      description: "Endpoints exclusivos para administradores",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Ingresa tu token JWT. Puedes obtenerlo desde los endpoints de autenticación.",
      },
    },
    schemas: {
      User: {
        type: "object",
        required: ["id", "name", "phone", "licensePlate"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Identificador único del usuario",
          },
          name: {
            type: "string",
            description: "Nombre completo del usuario",
          },
          email: {
            type: "string",
            format: "email",
            description: "Correo electrónico del usuario (opcional)",
          },
          phone: {
            type: "string",
            description: "Número de teléfono del usuario (formato internacional)",
          },
          licensePlate: {
            type: "string",
            description: "Placa del vehículo del usuario",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de creación del usuario",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de la última actualización del usuario",
          },
        },
      },
      Location: {
        type: "object",
        required: ["id", "name", "address", "totalSpots"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Identificador único de la ubicación",
          },
          name: {
            type: "string",
            description: "Nombre de la ubicación",
          },
          address: {
            type: "string",
            description: "Dirección completa de la ubicación",
          },
          city: {
            type: "string",
            description: "Ciudad donde se encuentra la ubicación",
          },
          state: {
            type: "string",
            description: "Estado o provincia donde se encuentra la ubicación",
          },
          country: {
            type: "string",
            description: "País donde se encuentra la ubicación",
          },
          totalSpots: {
            type: "integer",
            minimum: 1,
            description: "Número total de espacios de estacionamiento en la ubicación",
          },
          parkingSpots: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ParkingSpot",
            },
            description: "Lista de espacios de estacionamiento en esta ubicación",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de creación de la ubicación",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de la última actualización de la ubicación",
          },
        },
      },
      ParkingSpot: {
        type: "object",
        required: ["id", "spotNumber", "locationId"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Identificador único del espacio de estacionamiento",
          },
          spotNumber: {
            type: "integer",
            minimum: 1,
            description: "Número del espacio de estacionamiento",
          },
          locationId: {
            type: "string",
            format: "uuid",
            description: "ID de la ubicación a la que pertenece este espacio",
          },
          isAvailable: {
            type: "boolean",
            description: "Indica si el espacio está disponible actualmente",
          },
          price: {
            type: "number",
            format: "float",
            description: "Precio por hora del espacio de estacionamiento",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de creación del espacio",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de la última actualización del espacio",
          },
        },
      },
      Reservation: {
        type: "object",
        required: ["id", "userId", "parkingSpotId", "startTime", "endTime"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Identificador único de la reservación",
          },
          userId: {
            type: "string",
            format: "uuid",
            description: "ID del usuario que realizó la reservación",
          },
          parkingSpotId: {
            type: "string",
            format: "uuid",
            description: "ID del espacio de estacionamiento reservado",
          },
          startTime: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de inicio de la reservación",
          },
          endTime: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de fin de la reservación",
          },
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
            description: "Estado actual de la reservación",
          },
          price: {
            type: "number",
            format: "float",
            description: "Precio total de la reservación",
          },
          qrCode: {
            type: "string",
            description: "Código QR generado para la reservación (codificado en base64)",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de creación de la reservación",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de la última actualización de la reservación",
          },
          user: {
            $ref: "#/components/schemas/User",
          },
          parkingSpot: {
            $ref: "#/components/schemas/ParkingSpot",
          },
        },
      },
      Payment: {
        type: "object",
        required: ["id", "reservationId", "amount"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Identificador único del pago",
          },
          reservationId: {
            type: "string",
            format: "uuid",
            description: "ID de la reservación asociada al pago",
          },
          amount: {
            type: "number",
            format: "float",
            description: "Monto del pago",
          },
          status: {
            type: "string",
            enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
            description: "Estado actual del pago",
          },
          paymentMethod: {
            type: "string",
            description: "Método de pago utilizado",
          },
          transactionId: {
            type: "string",
            description: "ID de transacción del proveedor de pagos",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de creación del pago",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Fecha y hora de la última actualización del pago",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["phone", "licensePlate"],
        properties: {
          phone: {
            type: "string",
            description: "Número de teléfono del usuario",
          },
          licensePlate: {
            type: "string",
            description: "Placa del vehículo del usuario",
          },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            description: "Indica si el inicio de sesión fue exitoso",
          },
          token: {
            type: "string",
            description: "Token JWT para autenticación",
          },
          user: {
            $ref: "#/components/schemas/User",
          },
        },
      },
      AdminLoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: {
            type: "string",
            description: "Nombre de usuario del administrador",
          },
          password: {
            type: "string",
            format: "password",
            description: "Contraseña del administrador",
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "phone", "licensePlate"],
        properties: {
          name: {
            type: "string",
            description: "Nombre completo del usuario",
          },
          email: {
            type: "string",
            format: "email",
            description: "Correo electrónico del usuario (opcional)",
          },
          phone: {
            type: "string",
            description: "Número de teléfono del usuario",
          },
          licensePlate: {
            type: "string",
            description: "Placa del vehículo del usuario",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description: "Mensaje de error",
          },
          details: {
            type: "string",
            description: "Detalles adicionales del error (opcional)",
          },
        },
      },
      DashboardStats: {
        type: "object",
        properties: {
          totalUsers: {
            type: "integer",
            description: "Número total de usuarios registrados",
          },
          totalLocations: {
            type: "integer",
            description: "Número total de ubicaciones",
          },
          totalReservations: {
            type: "integer",
            description: "Número total de reservaciones",
          },
          totalRevenue: {
            type: "number",
            format: "float",
            description: "Ingresos totales",
          },
          activeReservations: {
            type: "integer",
            description: "Número de reservaciones activas actualmente",
          },
          recentReservations: {
            type: "integer",
            description: "Número de reservaciones en los últimos 7 días",
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: "No autorizado. El token de autenticación es inválido o ha expirado.",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              error: "No autorizado",
            },
          },
        },
      },
      NotFoundError: {
        description: "Recurso no encontrado",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              error: "Recurso no encontrado",
            },
          },
        },
      },
      ValidationError: {
        description: "Error de validación en los datos proporcionados",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              error: "Error de validación",
              details: "El campo 'phone' debe ser un número de teléfono válido",
            },
          },
        },
      },
      ServerError: {
        description: "Error interno del servidor",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ErrorResponse",
            },
            example: {
              error: "Error interno del servidor",
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Autenticación"],
        summary: "Iniciar sesión como usuario",
        description: "Autentica a un usuario con su número de teléfono y placa de vehículo",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
              example: {
                phone: "+5218111234567",
                licensePlate: "ABC123",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Inicio de sesión exitoso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginResponse",
                },
                example: {
                  success: true,
                  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  user: {
                    id: "user_id",
                    name: "Juan Pérez",
                    phone: "+5218111234567",
                    licensePlate: "ABC123",
                    email: "juan@example.com",
                  },
                },
              },
            },
          },
          "400": {
            description: "Datos de inicio de sesión inválidos",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "Teléfono y placa son requeridos",
                },
              },
            },
          },
          "401": {
            description: "Credenciales inválidas",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "Credenciales inválidas",
                },
              },
            },
          },
          "404": {
            description: "Usuario no encontrado",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "Usuario no encontrado. Por favor, regístrese primero.",
                },
              },
            },
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Autenticación"],
        summary: "Registrar un nuevo usuario",
        description: "Crea una nueva cuenta de usuario",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterRequest",
              },
              example: {
                name: "Juan Pérez",
                email: "juan@example.com",
                phone: "+5218111234567",
                licensePlate: "ABC123",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Registro exitoso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    user: {
                      $ref: "#/components/schemas/User",
                    },
                    token: {
                      type: "string",
                    },
                  },
                },
                example: {
                  success: true,
                  user: {
                    id: "user_id",
                    name: "Juan Pérez",
                    phone: "+5218111234567",
                    licensePlate: "ABC123",
                    email: "juan@example.com",
                  },
                  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            },
          },
          "400": {
            description: "Datos de registro inválidos",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "Ya existe un usuario con este número de teléfono",
                },
              },
            },
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
    "/api/auth/admin-login": {
      post: {
        tags: ["Autenticación"],
        summary: "Iniciar sesión como administrador",
        description: "Autentica a un administrador con su nombre de usuario y contraseña",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AdminLoginRequest",
              },
              example: {
                username: "admin",
                password: "your_password",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Inicio de sesión exitoso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    token: {
                      type: "string",
                    },
                    admin: {
                      type: "object",
                      properties: {
                        id: {
                          type: "string",
                        },
                        username: {
                          type: "string",
                        },
                        role: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
                example: {
                  success: true,
                  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                  admin: {
                    id: "admin_id",
                    username: "admin",
                    role: "ADMIN",
                  },
                },
              },
            },
          },
          "400": {
            description: "Datos de inicio de sesión inválidos",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "Nombre de usuario y contraseña son requeridos",
                },
              },
            },
          },
          "401": {
            description: "Credenciales inválidas",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "Credenciales inválidas",
                },
              },
            },
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
    "/api/locations": {
      get: {
        tags: ["Ubicaciones"],
        summary: "Obtener todas las ubicaciones",
        description: "Retorna una lista de todas las ubicaciones de estacionamiento disponibles",
        security: [],
        responses: {
          "200": {
            description: "Lista de ubicaciones",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    locations: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Location",
                      },
                    },
                  },
                },
              },
            },
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
    "/api/locations/{id}": {
      get: {
        tags: ["Ubicaciones"],
        summary: "Obtener detalles de una ubicación",
        description: "Retorna los detalles de una ubicación específica",
        security: [],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
            description: "ID de la ubicación",
          },
        ],
        responses: {
          "200": {
            description: "Detalles de la ubicación",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    location: {
                      $ref: "#/components/schemas/Location",
                    },
                  },
                },
              },
            },
          },
          "404": {
            $ref: "#/components/responses/NotFoundError",
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
    "/api/locations/{id}/spots": {
      get: {
        tags: ["Espacios de Estacionamiento"],
        summary: "Obtener espacios de estacionamiento de una ubicación",
        description: "Retorna todos los espacios de estacionamiento disponibles en una ubicación específica",
        security: [],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
            description: "ID de la ubicación",
          },
        ],
        responses: {
          "200": {
            description: "Lista de espacios de estacionamiento",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    parkingSpots: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/ParkingSpot",
                      },
                    },
                  },
                },
              },
            },
          },
          "404": {
            $ref: "#/components/responses/NotFoundError",
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
    "/api/reservations": {
      get: {
        tags: ["Reservaciones"],
        summary: "Obtener reservaciones del usuario actual",
        description: "Retorna todas las reservaciones del usuario autenticado",
        responses: {
          "200": {
            description: "Lista de reservaciones",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    reservations: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Reservation",
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            $ref: "#/components/responses/UnauthorizedError",
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
      post: {
        tags: ["Reservaciones"],
        summary: "Crear una nueva reservación",
        description: "Crea una nueva reservación de estacionamiento",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["parkingSpotId", "startTime", "endTime"],
                properties: {
                  parkingSpotId: {
                    type: "string",
                    format: "uuid",
                    description: "ID del espacio de estacionamiento",
                  },
                  startTime: {
                    type: "string",
                    format: "date-time",
                    description: "Fecha y hora de inicio de la reservación",
                  },
                  endTime: {
                    type: "string",
                    format: "date-time",
                    description: "Fecha y hora de fin de la reservación",
                  },
                },
              },
              example: {
                parkingSpotId: "spot_id",
                startTime: "2024-05-20T14:00:00Z",
                endTime: "2024-05-20T16:00:00Z",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Reservación creada exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    reservation: {
                      $ref: "#/components/schemas/Reservation",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Datos de reservación inválidos",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "La fecha de inicio debe ser anterior a la fecha de fin",
                },
              },
            },
          },
          "401": {
            $ref: "#/components/responses/UnauthorizedError",
          },
          "404": {
            description: "Espacio no encontrado",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
                example: {
                  error: "Espacio no encontrado",
                },
              },
            },
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
    "/api/reservations/{id}": {
      get: {
        tags: ["Reservaciones"],
        summary: "Obtener detalles de una reservación",
        description: "Retorna los detalles de una reservación específica",
        responses: {
          "200": {
            description: "Detalles de la reservación",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    reservation: {
                      $ref: "#/components/schemas/Reservation",
                    },
                  },
                },
              },
            },
          },
          "401": {
            $ref: "#/components/responses/UnauthorizedError",
          },
          "404": {
            $ref: "#/components/responses/NotFoundError",
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
      delete: {
        tags: ["Reservaciones"],
        summary: "Cancelar una reservación",
        description: "Cancela una reservación existente",
        responses: {
          "204": {
            description: "Reservación cancelada exitosamente",
          },
          "401": {
            $ref: "#/components/responses/UnauthorizedError",
          },
          "404": {
            $ref: "#/components/responses/NotFoundError",
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
    "/api/payments": {
      get: {
        tags: ["Pagos"],
        summary: "Obtener todos los pagos del usuario actual",
        description: "Retorna todos los pagos realizados por el usuario autenticado",
        responses: {
          "200": {
            description: "Lista de pagos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    payments: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Payment",
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            $ref: "#/components/responses/UnauthorizedError",
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
    "/api/payments/{id}": {
      get: {
        tags: ["Pagos"],
        summary: "Obtener detalles de un pago",
        description: "Retorna los detalles de un pago específico",
        responses: {
          "200": {
            description: "Detalles del pago",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                    },
                    payment: {
                      $ref: "#/components/schemas/Payment",
                    },
                  },
                },
              },
            },
          },
          "401": {
            $ref: "#/components/responses/UnauthorizedError",
          },
          "404": {
            $ref: "#/components/responses/NotFoundError",
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
    "/api/admin/dashboard": {
      get: {
        tags: ["Admin"],
        summary: "Obtener estadísticas del dashboard",
        description: "Retorna estadísticas generales para el panel de administración",
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          "200": {
            description: "Estadísticas del dashboard",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DashboardStats",
                },
              },
            },
          },
          "401": {
            $ref: "#/components/responses/UnauthorizedError",
          },
          "500": {
            $ref: "#/components/responses/ServerError",
          },
        },
      },
    },
  },
}
