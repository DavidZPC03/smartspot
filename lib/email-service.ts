import nodemailer from "nodemailer"
import { prisma } from "./prisma"

// Configuración del transporte de correo
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASSWORD || "",
  },
})

// Interfaz para el registro de correos enviados
interface EmailLog {
  id: string
  to: string
  subject: string
  sentAt: Date
  status: string
  reservationId?: string | null
}

export async function sendReceiptEmail(
  to: string,
  reservationId: string,
  reservationDetails: {
    spotNumber: number
    locationName: string
    startTime: Date
    endTime: Date
    price: number
    qrCode: string
  },
) {
  try {
    // Verificar que el correo electrónico no esté vacío
    if (!to) {
      console.error("Email address is empty, cannot send receipt")
      return { success: false, error: "Email address is empty" }
    }

    // Formatear fechas
    const startTime = new Date(reservationDetails.startTime)
    const endTime = new Date(reservationDetails.endTime)

    const startTimeFormatted = startTime.toLocaleString("es-MX", {
      dateStyle: "long",
      timeStyle: "short",
    })

    const endTimeFormatted = endTime.toLocaleString("es-MX", {
      dateStyle: "long",
      timeStyle: "short",
    })

    // Crear el contenido del correo
    const subject = `SMARTSPOT - Confirmación de Reserva #${reservationId.substring(0, 8)}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #3b82f6; margin: 0;">SMART<span style="color: #1f2937;">SPOT</span></h1>
          <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Confirmación de Reserva</p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Detalles de la Reserva</h2>
          <p><strong>Ubicación:</strong> ${reservationDetails.locationName}</p>
          <p><strong>Lugar:</strong> ${reservationDetails.spotNumber}</p>
          <p><strong>Fecha y hora de entrada:</strong> ${startTimeFormatted}</p>
          <p><strong>Fecha y hora de salida:</strong> ${endTimeFormatted}</p>
          <p><strong>Precio total:</strong> $${reservationDetails.price.toFixed(2)}</p>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="font-weight: bold; margin-bottom: 10px;">Código de Acceso</p>
          <div style="background-color: #ffffff; display: inline-block; padding: 10px 20px; border: 2px solid #3b82f6; border-radius: 5px; font-family: monospace; font-size: 24px; letter-spacing: 2px;">
            ${reservationDetails.qrCode}
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Muestra este código al personal del estacionamiento</p>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; font-size: 12px; color: #6b7280; text-align: center;">
          <p>Gracias por usar SMARTSPOT para tu reserva de estacionamiento.</p>
          <p>Si tienes alguna pregunta, contáctanos en soporte@smartspot.com</p>
        </div>
      </div>
    `

    // Enviar el correo
    const info = await transporter.sendMail({
      from: `"SMARTSPOT" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })

    console.log("Email sent:", info.messageId)

    // Registrar el correo enviado en la base de datos
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        sentAt: new Date(),
        status: "SENT",
        reservationId,
      },
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)

    // Registrar el error en la base de datos
    await prisma.emailLog.create({
      data: {
        to,
        subject: `SMARTSPOT - Confirmación de Reserva #${reservationId.substring(0, 8)}`,
        sentAt: new Date(),
        status: "FAILED",
        reservationId,
      },
    })

    return { success: false, error }
  }
}

export async function getEmailLogs(page = 1, limit = 20): Promise<EmailLog[]> {
  const skip = (page - 1) * limit

  const logs = await prisma.emailLog.findMany({
    skip,
    take: limit,
    orderBy: {
      sentAt: "desc",
    },
  })

  return logs
}

