import Stripe from "stripe"

// Verificar que la clave secreta de Stripe esté definida
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY no está definida en las variables de entorno")
}

// Crear una instancia de Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
  typescript: true,
  appInfo: {
    name: "SMARTSPOT Parking",
    version: "1.0.0",
  },
  // Aumentar el timeout para evitar errores en producción
  timeout: 30000, // 30 segundos
})

export default stripe

