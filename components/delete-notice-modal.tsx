"use client"

import type { Aviso as Notice } from "@/lib/types"
import { X, AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
// Store eliminado; eliminación via API

interface DeleteNoticeModalProps {
  isOpen: boolean
  onClose: () => void
  notice: Notice | null
}

export default function DeleteNoticeModal({ isOpen, onClose, notice }: DeleteNoticeModalProps) {
  const handleDelete = async () => {
    if (!notice) return
    try {
      // Aquí podrías invocar un DELETE si existe; hoy page de avisos ya hace PUT de expiración
      await fetch(`/api/avisos/${notice.id}`, { method: "DELETE" }).catch(() => {})
    } finally {
      onClose()
    }
  }

  if (!isOpen || !notice) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md text-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Eliminar Aviso
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="py-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar este aviso? Esta acción no se puede deshacer.
          </p>
          <p className="font-medium mt-2 text-gray-900">{notice.title}</p>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="destructive" onClick={onClose} className="text-white">
            Cancelar
          </Button>
          <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}
