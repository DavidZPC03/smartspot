import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            <span className="text-blue-600">SMART</span>
            <span className="text-gray-800">SPOT</span>
          </CardTitle>
          <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Reserva en línea</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/user-login" className="w-full">
            <Button className="w-full text-lg py-6" size="lg">
              Iniciar Sesión
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button variant="outline" className="w-full text-lg py-6" size="lg">
              Registrate
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

