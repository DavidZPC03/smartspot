import Link from "next/link"
import { UserPlus, LogIn, Info } from "lucide-react"
import ParticlesBackground from "@/components/particles-background"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative">
      <ParticlesBackground />

      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-bold tracking-tight text-blue-600 sm:text-6xl mb-6">SmartSpot Parking</h1>
        <p className="text-xl text-gray-700 mb-4 max-w-2xl">
          Encuentra y reserva tu lugar de estacionamiento de manera fácil y rápida
        </p>

        <div className="mb-8 flex items-center justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-blue-50 border-blue-200 hover:bg-blue-100"
                >
                  <Info className="h-5 w-5 text-blue-600" />
                  <span className="sr-only">Información de precios</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-4 bg-white text-left">
                <p className="font-medium text-blue-600 mb-2">Información de precios:</p>
                <p className="text-gray-700">
                  Se cobrará 100 pesos por la reservación (incluye la primera hora) + 20 pesos por cada hora adicional o
                  extra que se pase la persona en el estacionamiento.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <Link
            href="/user-login"
            className="group rounded-lg border border-blue-200 bg-white px-5 py-4 shadow-md transition-all hover:shadow-lg hover:border-blue-300"
          >
            <h2 className="mb-3 text-2xl font-semibold text-blue-600 flex items-center">
              <LogIn className="mr-2 h-5 w-5" />
              Iniciar Sesión{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none ml-1">
                →
              </span>
            </h2>
            <p className="text-gray-600">Accede a tu cuenta para ver tus reservaciones y más.</p>
          </Link>

          <Link
            href="/register"
            className="group rounded-lg border border-blue-200 bg-white px-5 py-4 shadow-md transition-all hover:shadow-lg hover:border-blue-300"
          >
            <h2 className="mb-3 text-2xl font-semibold text-blue-600 flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Registrarse{" "}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none ml-1">
                →
              </span>
            </h2>
            <p className="text-gray-600">Crea una cuenta para empezar a reservar espacios.</p>
          </Link>
        </div>
      </div>
    </main>
  )
}

