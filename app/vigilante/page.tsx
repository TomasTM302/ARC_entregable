"use client"

import { useState, useCallback, useRef, useEffect, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { QrScanner } from "@/components/qr-scanner"
import { ScanBarcode, Shield, X, CheckCircle, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import EntryHistoryTable from "@/components/qr-scan-history"
import Image from "next/image"
import { useAuthStore } from "@/lib/auth"

interface QrData {
  [key: string]: string | undefined
  FOTO_INVITADO_URL?: string // Added for guest photo URL from QR
}

interface ScanHistoryEntry {
  ine: string | null
  tipo?: string
  vigilante_id?: string | number
  condominio_id?: string | number
  placa_vehiculo?: string | null
  scanned_at?: string
  fecha_entrada?: string
}

export default function VigilanteDashboardPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentDecodedText, setCurrentDecodedText] = useState<string | null>(null)
  const [currentParsedData, setCurrentParsedData] = useState<QrData | null>(null)
  const [guestPhotoUrlFromQR, setGuestPhotoUrlFromQR] = useState<string | null>(null) // New state for guest photo

  const [licensePlateImageFile, setLicensePlateImageFile] = useState<File | null>(null)
  const [ineImageFile, setIneImageFile] = useState<File | null>(null)
  const [licensePlateImageUrlPreview, setLicensePlateImageUrlPreview] = useState<string | null>(null)
  const [ineImageUrlPreview, setIneImageUrlPreview] = useState<string | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { user } = useAuthStore()

  const licensePlateInputRef = useRef<HTMLInputElement>(null)
  const ineInputRef = useRef<HTMLInputElement>(null)
  const isMountedRef = useRef(true)

  const parseQrData = useCallback((data: string): QrData => {
    const lines = data.split("\n")
    const parsedData: QrData = {}
    lines.forEach((line) => {
      const colonIndex = line.indexOf(":")
      if (colonIndex !== -1) {
        const key = line.substring(0, colonIndex).trim()
        const value = line.substring(colonIndex + 1).trim()
        parsedData[key] = value
      }
    })
    console.log("Parsed QR Data:", parsedData) // Log to see all parsed fields
    return parsedData
  }, [])

  const resetImageStates = () => {
    setLicensePlateImageFile(null)
    setIneImageFile(null)
    setLicensePlateImageUrlPreview(null)
    setIneImageUrlPreview(null)
    setGuestPhotoUrlFromQR(null) // Reset guest photo URL
    if (licensePlateInputRef.current) licensePlateInputRef.current.value = ""
    if (ineInputRef.current) ineInputRef.current.value = ""
  }

  const handleScan = useCallback(
    (decodedText: string) => {
      if (!decodedText || !isMountedRef.current) return
      try {
        const parsedData = parseQrData(decodedText)
        if (isMountedRef.current) {
          setCurrentDecodedText(decodedText)
          setCurrentParsedData(parsedData)
          // Extract and set guest photo URL from parsed data
          setGuestPhotoUrlFromQR(parsedData.FOTO_INVITADO_URL || null)
          console.log("Guest photo URL from QR:", parsedData.FOTO_INVITADO_URL)

          setIsScanning(false)
          setShowModal(true)
          setScanError(null)
          // resetImageStates() is called when modal opens/closes or scan starts
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error("Error parsing QR data on page:", error)
          setScanError("Error al procesar los datos del código QR.")
          setGuestPhotoUrlFromQR(null)
        }
      }
    },
    [parseQrData],
  )

  const handleError = useCallback((err: any) => {
    if (!isMountedRef.current) return
    console.error("QR Scanner error reported to vigilante page:", err)
    setIsScanning(false)
    setScanError(typeof err === "string" ? err : "Error al escanear el código QR.")
  }, [])

  const startScanning = useCallback(() => {
    if (isMountedRef.current) {
      setIsScanning(true)
      setCurrentParsedData(null)
      setCurrentDecodedText(null)
      setScanError(null)
      resetImageStates()
    }
  }, [])

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    setImageFile: (file: File | null) => void,
    setPreviewUrl: (url: string | null) => void,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setImageFile(null)
      setPreviewUrl(null)
    }
  }

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!file) return null
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al subir archivo")
      }
      return data.url as string
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error al subir imagen",
        description: error.message || "No se pudo subir el archivo.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirmAndSave = async () => {
    if (!currentDecodedText) return

    setIsSaving(true)
    let licensePlateUrl: string | null = null
    let ineUrl: string | null = null

    if (licensePlateImageFile) {
      licensePlateUrl = await uploadFile(licensePlateImageFile, "visit_images/license_plates")
      if (!licensePlateUrl) {
        setIsSaving(false)
        return
      }
    }

    if (ineImageFile) {
      ineUrl = await uploadFile(ineImageFile, "visit_images/ines")
      if (!ineUrl && ineImageFile) {
        // Check if ineImageFile exists before showing toast
        toast({
          title: "Advertencia",
          description: "No se pudo subir la imagen de la INE, pero se guardará el resto de la información.",
          variant: "default",
        })
        // Do not return here if license plate was successful or not attempted
      }
    }

    const entryToSave: ScanHistoryEntry = {
      ine: ineUrl,
      tipo: 'invitado',
      vigilante_id: user?.id,
      condominio_id: user?.condominiumId,
      placa_vehiculo: licensePlateUrl,
      scanned_at: currentDecodedText ?? '',
      fecha_entrada: new Date().toISOString(),
    } as any

    try {
      const res = await fetch("/api/entry-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryToSave),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al guardar")
      }
      toast({
        title: "Registro Guardado",
        description: "La información del visitante y las imágenes han sido guardadas.",
        action: <CheckCircle className="text-green-500" />,
      })
      setShowModal(false)
      // resetImageStates() is called when modal closes
    } catch (error: any) {
      console.error("Error saving scan history:", error)
      toast({
        title: "Error al Guardar",
        description: error.message || "No se pudo guardar el registro en el historial.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500" />,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getFieldLabel = useCallback((key: string): string => {
    const labels: Record<string, string> = {
      NOMBRE: "Nombre",
      TELÉFONO: "Teléfono",
      TELEFONO: "Teléfono",
      FECHA: "Fecha de visita",
      HORA: "Hora de entrada",
      DIRECCIÓN: "Destino",
      DIRECCION: "Destino",
      ACOMPAÑANTES: "Acompañantes",
      ACOMPANANTES: "Acompañantes",
      FOTO_INVITADO_URL: "Foto del Invitado (del QR)", // Label for the new field if displayed directly
    }
    return labels[key] || key
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Call resetImageStates when modal is closed or scan starts
  useEffect(() => {
    if (!showModal || isScanning) {
      resetImageStates()
    }
  }, [showModal, isScanning])

  const isLoading = isUploading || isSaving

  return (
    <div className="bg-white rounded-lg p-6 w-full text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <ScanBarcode className="h-6 w-6 mr-2 text-[#3b6dc7]" />
          <h2 className="text-2xl font-semibold">Escanear QR de Visitante</h2>
        </div>
      </div>

      {!isScanning && !scanError && (
        <div className="text-center py-8">
          <div className="mb-8">
            <Shield className="h-16 w-16 mx-auto mb-4 text-[#3b6dc7] opacity-70" />
            <p className="text-lg mb-2">Bienvenido</p>
            <p className="text-gray-600">Escanee códigos QR para registrar el acceso de visitantes.</p>
          </div>
          <Button
            className="w-full max-w-md bg-[#3b6dc7] hover:bg-[#2d5db3] text-white py-6 text-lg"
            onClick={startScanning}
            disabled={isLoading}
          >
            <ScanBarcode className="mr-2 h-6 w-6" />
            Escanear Código QR
          </Button>
        </div>
      )}

      {isScanning && (
        <div className="bg-white rounded-lg p-4 w-full text-gray-800 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Apunta al Código QR</h2>
          <div className="relative">
            <QrScanner onScan={handleScan} onError={handleError} width={300} height={300} />
            <Button
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={() => setIsScanning(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {scanError && (
        <div className="bg-white rounded-lg p-6 w-full text-gray-800 mb-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <p className="font-bold">Error al escanear</p>
            <span className="block sm:inline">{scanError}</span>
          </div>
          <Button
            className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white"
            onClick={startScanning}
            disabled={isLoading}
          >
            Intentar de nuevo
          </Button>
        </div>
      )}

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!isLoading) setShowModal(open)
          // resetImageStates is now handled by useEffect watching showModal
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Información del Visitante y Captura Adicional</DialogTitle>
            <DialogClose asChild disabled={isLoading}>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            {/* Display Guest Photo from QR */}
            {guestPhotoUrlFromQR && (
              <div className="mb-4 text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">Foto del Invitado (Registrada)</p>
                <Image
                  src={guestPhotoUrlFromQR || "/placeholder.svg"}
                  alt="Foto del invitado"
                  width={150}
                  height={150}
                  className="rounded-md object-cover mx-auto border"
                  onError={(e) => {
                    console.warn("Error loading guest photo from QR URL:", guestPhotoUrlFromQR)
                    // Optionally set a placeholder if image fails to load
                    // e.currentTarget.src = "/placeholder.svg?width=150&height=150"
                  }}
                />
              </div>
            )}
            {/* Si no hay URL de foto en el QR, no mostramos nada para el invitado */}

            {currentParsedData &&
              Object.entries(currentParsedData).map(([key, value]) => {
                // Don't display the FOTO_INVITADO_URL as a text field if we are already showing the image
                if (key === "FOTO_INVITADO_URL") return null
                return (
                  <div key={key}>
                    <p className="text-sm text-gray-500">{getFieldLabel(key)}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                )
              })}
            <hr className="my-4" />
            {/* Captura Foto Placa */}
            <div className="space-y-2">
              <label htmlFor="licensePlate" className="font-medium">
                Foto de Placa del Vehículo (Captura Actual)
              </label>
              <Input
                id="licensePlate"
                type="file"
                accept="image/*"
                capture="environment"
                ref={licensePlateInputRef}
                onChange={(e) => handleFileChange(e, setLicensePlateImageFile, setLicensePlateImageUrlPreview)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                disabled={isLoading}
              />
              {licensePlateImageUrlPreview && (
                <div className="mt-2">
                  <Image
                    src={licensePlateImageUrlPreview || "/placeholder.svg"}
                    alt="Vista previa placa"
                    width={200}
                    height={150}
                    className="rounded-md object-contain border"
                  />
                </div>
              )}
            </div>

            {/* Captura Foto INE */}
            <div className="space-y-2 mt-4">
              <label htmlFor="ineImage" className="font-medium">
                Foto de INE del Invitado (Captura Actual)
              </label>
              <Input
                id="ineImage"
                type="file"
                accept="image/*"
                capture="environment"
                ref={ineInputRef}
                onChange={(e) => handleFileChange(e, setIneImageFile, setIneImageUrlPreview)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                disabled={isLoading}
              />
              {ineImageUrlPreview && (
                <div className="mt-2">
                  <Image
                    src={ineImageUrlPreview || "/placeholder.svg"}
                    alt="Vista previa INE"
                    width={200}
                    height={150}
                    className="rounded-md object-contain border"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (!isLoading) setShowModal(false)
                // resetImageStates is handled by useEffect
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAndSave}
              disabled={isLoading || !currentDecodedText} // Only need currentDecodedText to save something
            >
              {isLoading ? "Guardando..." : "Confirmar y Guardar Registro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EntryHistoryTable />
    </div>
  )
}
