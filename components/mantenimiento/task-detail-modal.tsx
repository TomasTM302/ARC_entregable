"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useMantenimientoTasksStore } from "@/lib/mantenimiento-tasks-store"
import { useAuthStore } from "@/lib/auth"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, MessageSquare, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
}

export default function TaskDetailModal({ isOpen, onClose, taskId }: TaskDetailModalProps) {
  const { tasks, addComment, updateTask } = useMantenimientoTasksStore()
  const { user } = useAuthStore()
  const [comment, setComment] = useState("")

  const task = tasks.find((t) => t.id === taskId)

  if (!task) return null

  const handleAddComment = () => {
    if (!comment.trim() || !user) return
    addComment(taskId, user.id, `${user.firstName} ${user.lastName}`, comment)
    setComment("")
  }

  const handleStatusChange = async (newStatus: "in-progress") => {
    await updateTask(taskId, { status: newStatus })
  }

  // Función para obtener el color de la prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  // Función para obtener el texto de la prioridad
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta"
      case "medium":
        return "Media"
      case "low":
        return "Baja"
      default:
        return "Normal"
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: es })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-[500px] p-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative pb-2">
          <button
            onClick={onClose}
            className="absolute right-0 top-0 p-2 rounded-full hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <DialogTitle className="text-xl pr-8">Detalle de la Tarea</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
            {task.isPersonalReminder && (
              <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full mb-2">
                Recordatorio personal
              </span>
            )}
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs text-white ${getPriorityColor(task.priority)} mb-2`}
            >
              Prioridad: {getPriorityText(task.priority)}
            </span>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-gray-700 text-sm">{task.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <p className="text-gray-500">Estado:</p>
              <p>
                {task.status === "pending" ? (
                  <Badge className="bg-yellow-500 text-white">Pendiente</Badge>
                ) : task.status === "in-progress" ? (
                  <Badge className="bg-blue-500 text-white">En progreso</Badge>
                ) : (
                  <Badge className="bg-green-500 text-white">Completada</Badge>
                )}
              </p>
            </div>
            <div className="flex justify-between border-b pb-2">
              <p className="text-gray-500">Condominio:</p>
              <p className="font-medium">{task.condominium || "No especificado"}</p>
            </div>
            <div className="flex justify-between border-b pb-2">
              <p className="text-gray-500">Sección:</p>
              <p className="font-medium">{task.section || "No especificada"}</p>
            </div>
            <div className="flex justify-between border-b pb-2">
              <p className="text-gray-500">Creado:</p>
              <p>{formatDate(task.createdAt)}</p>
            </div>
            {task.completedAt && (
              <div className="flex justify-between border-b pb-2">
                <p className="text-gray-500">Completado:</p>
                <p>{formatDate(task.completedAt)}</p>
              </div>
            )}
          </div>

          {task.status === "pending" && (
            <div className="flex justify-center">
              <Button
                className="w-full bg-blue-500 text-white hover:bg-blue-600"
                onClick={() => handleStatusChange("in-progress")}
              >
                <Clock className="h-4 w-4 mr-2" />
                Iniciar Tarea
              </Button>
            </div>
          )}

          {/* Comentarios */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              Comentarios ({task.comments ? task.comments.length : 0})
            </h4>

            <div className="space-y-3 max-h-40 overflow-y-auto mb-4">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-sm">{comment.userName}</p>
                      <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No hay comentarios todavía.</p>
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <Textarea
                placeholder="Añadir un comentario..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none text-base"
                rows={3}
              />
              <Button onClick={handleAddComment} disabled={!comment.trim()} className="w-full">
                Enviar Comentario
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
