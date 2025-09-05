"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Camera, SwitchCamera } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QrScannerProps {
  onScan: (data: string) => void
  onError: (error: any) => void
  width?: number
  height?: number
}

interface CameraDevice {
  id: string
  label: string
}

export function QrScanner({ onScan, onError, width = 300, height = 300 }: QrScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Función para obtener las cámaras disponibles
  const getCameras = async () => {
    try {
      setIsLoading(true)
      const devices = await Html5Qrcode.getCameras()
      if (devices && devices.length) {
        setCameras(devices)
        // Seleccionar la cámara trasera por defecto si está disponible
        const backCamera = devices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("trasera") ||
            device.label.toLowerCase().includes("rear"),
        )
        setSelectedCamera(backCamera ? backCamera.id : devices[0].id)
      } else {
        onError("No se encontraron cámaras disponibles")
      }
    } catch (err) {
      console.error("Error getting cameras:", err)
      onError("Error al obtener las cámaras disponibles")
    } finally {
      setIsLoading(false)
    }
  }

  // Inicializar el escáner con la cámara seleccionada
  const initializeScanner = (cameraId: string) => {
    if (!containerRef.current) return

    // Create a unique ID for the scanner element
    const scannerId = `qr-scanner-${Math.random().toString(36).substring(2, 9)}`

    // Create the scanner element if it doesn't exist
    if (!document.getElementById(scannerId) && containerRef.current) {
      const scannerElement = document.createElement("div")
      scannerElement.id = scannerId
      containerRef.current.appendChild(scannerElement)

      // Stop previous scanner if exists
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }

      // Initialize the scanner with a delay to ensure DOM is ready
      setTimeout(() => {
        try {
          const scanner = new Html5Qrcode(scannerId)
          scannerRef.current = scanner
          setIsInitialized(true)

          // Start scanning with the selected camera
          scanner
            .start(
              cameraId,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
              },
              (decodedText) => {
                onScan(decodedText)
              },
              (errorMessage) => {
                // Ignorar errores esperados cuando no hay código en cuadro para evitar spam en consola
                const msg = String(errorMessage)
                if (
                  msg &&
                  (msg.includes("No QR code found") ||
                    msg.includes("NotFoundException") ||
                    msg.includes("No MultiFormat Readers"))
                ) {
                  return
                }
                console.log("QR Scanner error:", errorMessage)
              },
            )
            .catch((err) => {
              console.error("Failed to start scanner:", err)
              onError("No se pudo iniciar el escáner. Por favor, asegúrese de que su cámara esté habilitada.")
              setIsInitialized(false)
            })
        } catch (err) {
          console.error("Error initializing scanner:", err)
          onError("Error al inicializar el escáner. Por favor, recargue la página e intente de nuevo.")
          setIsInitialized(false)
        }
      }, 1000)
    }
  }

  // Cambiar de cámara
  const handleCameraChange = (cameraId: string) => {
    setSelectedCamera(cameraId)
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          initializeScanner(cameraId)
        })
        .catch((err) => {
          console.error("Error stopping scanner:", err)
          onError("Error al cambiar de cámara. Por favor, intente de nuevo.")
        })
    } else {
      initializeScanner(cameraId)
    }
  }

  // Obtener las cámaras al montar el componente
  useEffect(() => {
    getCameras()

    // Clean up on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null
            setIsInitialized(false)
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err)
          })
      }
    }
  }, [])

  // Inicializar el escáner cuando se selecciona una cámara
  useEffect(() => {
    if (selectedCamera && !isLoading) {
      initializeScanner(selectedCamera)
    }
  }, [selectedCamera, isLoading])

  return (
    <div className="flex flex-col items-center">
      {/* Selector de cámara */}
      {cameras.length > 1 && (
        <div className="w-full mb-4">
          <Select value={selectedCamera} onValueChange={handleCameraChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar cámara" />
            </SelectTrigger>
            <SelectContent>
              {cameras.map((camera) => (
                <SelectItem key={camera.id} value={camera.id}>
                  <div className="flex items-center">
                    <Camera className="h-4 w-4 mr-2" />
                    <span>{camera.label || `Cámara ${camera.id.slice(0, 5)}...`}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Contenedor del escáner */}
      <div
        ref={containerRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          margin: "0 auto",
          position: "relative",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <p className="text-gray-500">Buscando cámaras disponibles...</p>
          </div>
        )}

        {!isLoading && !isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <p className="text-gray-500">Inicializando cámara...</p>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              border: "2px solid #3b6dc7",
              width: "250px",
              height: "250px",
              borderRadius: "8px",
              boxShadow: "0 0 0 4000px rgba(0, 0, 0, 0.5)",
            }}
          />
        </div>
      </div>

      {/* Botón para cambiar rápidamente entre cámaras */}
      {cameras.length > 1 && isInitialized && (
        <Button
          className="mt-4 bg-[#3b6dc7]"
          onClick={() => {
            const currentIndex = cameras.findIndex((camera) => camera.id === selectedCamera)
            const nextIndex = (currentIndex + 1) % cameras.length
            handleCameraChange(cameras[nextIndex].id)
          }}
        >
          <SwitchCamera className="h-4 w-4 mr-2" />
          Cambiar cámara
        </Button>
      )}
    </div>
  )
}
