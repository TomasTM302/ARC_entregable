"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useAuxiliarTasksStore } from "@/lib/auxiliar-tasks-store"
import { useAuthStore } from "@/lib/auth"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Send, Trash } from "lucide-react"

interface AuxiliarTaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: string
}

export default function AuxiliarTaskDetailModal({ isOpen, onClose, taskId }: AuxiliarTaskDetailModalProps) {
  const { tasks, addComment, deleteTask } = useAuxiliarTasksStore()
  const { user, users } = useAuthStore()
  const [newComment, setNewComment] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const task = tasks.find((t) => t.id === taskId)

  if (!task || !user) return null

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
    return format(new Date(dateString), "dd MMM yyyy HH:mm", { locale: es })
  }

  // Obtener nombre de auxiliar
  const getAuxiliarName = (auxiliarId: string) => {
    const auxiliar = users.find((user) => user.id === auxiliarId)
    return auxiliar ? `${auxiliar.firstName} ${auxiliar.lastName}` : "Desconocido"
  }

  // Función para enviar un comentario
  const handleSendComment = () => {
    if (!newComment.trim()) return

    addComment({
      taskId: task.id,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      content: newComment.trim(),
    })

    setNewComment("")
  }

  // Función para eliminar la tarea
  const handleDeleteTask = () => {
    setIsDeleting(true)
    deleteTask(task.id)
    setIsDeleting(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Tarea</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold">{task.title}</h2>
            <Badge className={`${getPriorityColor(task.priority)} text-white`}>{getPriorityText(task.priority)}</Badge>
          </div>

          {task.description && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Asignado a</p>
              <p className="font-medium">{getAuxiliarName(task.assignedTo)}</p>
            </div>
            <div>
              <p className="text-gray-500">Estado</p>
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
            <div>
              <p className="text-gray-500">Condominio</p>
              <p className="font-medium">{task.condominium || "No especificado"}</p>
            </div>
            <div>
              <p className="text-gray-500">Sección</p>
              <p className="font-medium">{task.section || "No especificada"}</p>
            </div>
            <div>
              <p className="text-gray-500">Fecha de creación</p>
              <p>{formatDate(task.createdAt)}</p>
            </div>
            {task.completedAt && (
              <div>
                <p className="text-gray-500">Fecha de finalización</p>
                <p>{formatDate(task.completedAt)}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-2">Comentarios</h3>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{comment.userName}</p>
                      <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                    </div>
                    <p className="text-sm mt-1">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No hay comentarios todavía.</p>
              )}
            </div>

            <div className="flex space-x-2">
              <Textarea
                placeholder="Escribe un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none"
              />
              <Button
                type="button"
                className="bg-blue-600 text-white"
                onClick={handleSendComment}
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleDeleteTask}
              disabled={isDeleting}
            >
              <Trash className="h-4 w-4 mr-2" />
              {isDeleting ? "Eliminando..." : "Eliminar tarea"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
