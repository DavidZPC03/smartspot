import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    console.log("Test endpoint called with ID:", id)

    // Return a simple response to verify the endpoint works
    return NextResponse.json({
      message: "Test endpoint working correctly",
      receivedId: id,
    })
  } catch (error) {
    console.error("Error in test endpoint:", error)
    return NextResponse.json({ error: "Error en endpoint de prueba" }, { status: 500 })
  }
}

