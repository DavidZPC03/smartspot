import { Loader2 } from "lucide-react"

export default function QRScannerLoading() {
  return (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-lg font-medium">Cargando escáner de QR...</p>
      </div>
    </div>
  )
}
