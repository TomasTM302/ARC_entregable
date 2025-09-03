"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMantenimientoTasksStore } from "@/lib/mantenimiento-tasks-store"
import { useAuthStore } from "@/lib/auth"
import { ImagePlus, X, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CompleteTaskModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
}

export default function CompleteTaskModal({ isOpen, onClose, taskId }: CompleteTaskModalProps) {
  const { tasks, addReport, completeTask } = useMantenimientoTasksStore()
  const { user } = useAuthStore()
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [previewImages, setPreviewImages] = useState<string[]>([])

  // Buscar la tarea por ID
  const task = tasks.find((t) => t.id === taskId)

  // Si no se encuentra la tarea, no renderizar nada
  if (!task) return null

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setPreviewImages((prev) => [...prev, event.target!.result as string])
            // En una aplicación real, aquí subiríamos la imagen a un servidor
            // y obtendríamos una URL. Por ahora, usamos la URL del data URL
            setImages((prev) => [...prev, event.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
        return URL.createObjectURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!comment.trim() || !user) return

    setIsSubmitting(true)

    // Obtener la tarea actual
    const currentTask = tasks.find((t) => t.id === taskId)
    if (!currentTask) return

    // Actualizar el estado de la tarea a completada
  await completeTask(taskId)

    // Crear un reporte asociado a esta tarea completada
    addReport({
      title: `Tarea completada: ${currentTask.title}`,
      description: comment,
      mantenimientoId: user.id,
      mantenimientoName: `${user.firstName} ${user.lastName}`,
      taskId: taskId,
      status: "completed",
      section: currentTask.section,
      condominium: currentTask.condominium,
      images: images,
    })

    setIsSubmitting(false)
    onClose()
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
          <DialogTitle className="text-xl pr-8">Completar Tarea</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="bg-green-50 p-3 rounded-md flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Vas a marcar como completada la siguiente tarea:</p>
              <p className="text-gray-700 mt-1 text-sm">{task.title}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">
              Descripción del trabajo realizado
            </Label>
            <Textarea
              id="description"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe el trabajo que realizaste para completar esta tarea..."
              className="bg-gray-200 text-black min-h-[120px] text-base"
              required
            />
          </div>

          {/* Sección para subir imágenes */}
          <div className="space-y-2">
            <Label className="text-sm">Imágenes del trabajo realizado</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
              <div className="flex flex-wrap gap-2 mb-3">
                {previewImages.map((img, index) => (
                  <div key={index} className="relative w-16 h-16">
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <Label
                htmlFor="image-upload-task"
                className="flex flex-col items-center justify-center cursor-pointer py-3"
              >
                <ImagePlus className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Toca para agregar imágenes</span>
                <Input
                  id="image-upload-task"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </Label>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={onClose}
              className="w-full sm:w-auto text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Completar Tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
