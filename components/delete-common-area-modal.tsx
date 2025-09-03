"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useCommonAreasStore, type CommonArea } from "@/lib/common-areas-store"
import { toast } from "@/components/ui/use-toast"
import { AlertTriangle } from "lucide-react"

interface DeleteCommonAreaModalProps {
  isOpen: boolean
  onClose: () => void
  area: CommonArea
}

export default function DeleteCommonAreaModal({ isOpen, onClose, area }: DeleteCommonAreaModalProps) {
  const { removeArea } = useCommonAreasStore()

  const handleDelete = () => {
    removeArea(area.id)

    toast({
      title: "Área eliminada",
      description: `El área "${area.name}" ha sido eliminada exitosamente.`,
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Eliminar área común
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar el área <strong>{area.name}</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
          <p className="text-sm text-yellow-800">
            <strong>Advertencia:</strong> Al eliminar esta área, también se eliminarán todas las reservaciones asociadas
            a ella.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
