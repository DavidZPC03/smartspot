import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { generateQRCode } from "@/lib/qrcode"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Obtener el token del encabezado de autorización
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No se encontró token de autorización en la solicitud")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    if (!token) {
      console.log("Token vacío en la solicitud")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Usar getUserFromRequest en lugar de getCurrentUser
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const reservationId = params.id

    // Obtener la reservación
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        parkingSpot: {
          include: {
            location: true,
          },
        },
        user: true,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 })
    }

    // Verificar que la reservación pertenece al usuario
    if (reservation.userId !== user.id) {
      return NextResponse.json({ error: "No autorizado para esta reservación" }, { status: 403 })
    }

    // Marcar la reservación como pagada y pendiente de confirmación
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: "PENDING", // Pendiente de confirmación por escaneo
        paymentStatus: "PAID",
      },
    })

    // Generar QR con la información de la reservación
    const qrData = {
      id: reservation.id,
      userId: user.id,
      nombre: user.name || "Usuario",
      fechaReservacion: new Date().toISOString(),
      horaInicio: reservation.startTime.toISOString(),
      horaFin: reservation.endTime.toISOString(),
      lugarEstacionamiento: `Lugar ${reservation.parkingSpot.spotNumber}`,
      ubicacion: reservation.parkingSpot.location.name,
      estado: "PENDIENTE", // Cambiado de PAGADO a PENDIENTE
      precio: reservation.price,
    }

    // Generar el QR como una cadena de texto JSON
    const qrCodeContent = JSON.stringify(qrData)

    // Generar el QR como una imagen
    const qrCodeDataUrl = await generateQRCode(qrCodeContent)

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl,
      reservation: {
        id: reservation.id,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        parkingSpotNumber: reservation.parkingSpot.spotNumber,
        locationName: reservation.parkingSpot.location.name,
        status: "PENDING", 
      },
    })
  } catch (error) {
    console.error("Error processing payment:", error)
    return NextResponse.json({ error: "Error al procesar el pago", details: (error as Error).message }, { status: 500 })
  }
}
