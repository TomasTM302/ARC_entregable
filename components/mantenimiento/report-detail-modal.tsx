"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useMantenimientoTasksStore } from "@/lib/mantenimiento-tasks-store"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useState } from "react"
import { X } from "lucide-react"

interface ReportDetailModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string
}

export default function ReportDetailModal({ isOpen, onClose, reportId }: ReportDetailModalProps) {
  const { reports } = useMantenimientoTasksStore()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const report = reports.find((r) => r.id === reportId)

  if (!report) return null

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: es })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] p-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative pb-2">
          <button
            onClick={onClose}
            className="absolute right-0 top-0 p-2 rounded-full hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <DialogTitle className="text-xl pr-8">Detalle de la Actividad</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <h2 className="text-lg font-semibold mb-1">{report.title}</h2>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Sección:</span> {report.section || "No especificada"}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Condominio:</span> {report.condominium || "No especificado"}
            </p>
            <p className="text-sm text-gray-500">Creada el {formatDate(report.createdAt)}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-700 whitespace-pre-line text-sm">{report.description}</p>
          </div>

          {report.images && report.images.length > 0 && (
            <div>
              <h3 className="font-medium mb-2 text-sm">Imágenes</h3>
              <div className="grid grid-cols-3 gap-2">
                {report.images.map((image, index) => (
                  <div
                    key={index}
                    className="border rounded-md overflow-hidden cursor-pointer aspect-square"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal para ver imagen ampliada */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-[90vw] max-h-[80vh]">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 bg-white hover:bg-gray-200 rounded-full p-3 shadow-md transition-colors duration-200 flex items-center justify-center z-10"
                aria-label="Cerrar imagen"
                title="Cerrar"
              >
                <X className="h-6 w-6 text-gray-700" />
              </button>
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Imagen ampliada"
                className="max-w-full max-h-[80vh] object-contain mx-auto"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
