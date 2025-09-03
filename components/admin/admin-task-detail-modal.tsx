"use client"
import React from "react"
import { X, Calendar, User, ClipboardList, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type UITask = {
  id: string | number
  title: string
  description?: string | null
  assignedTo?: string | number | null
  createdBy?: string | number | null
  condominiumId?: string | number | null
  priority: "high" | "medium" | "low"
  status: "pending" | "in-progress" | "completed" | "cancelled" | string
  department?: string | null
  createdAt?: string | null
  dueDate?: string | null
  completedAt?: string | null
  notes?: string | null
}

export default function AdminTaskDetailModal({
  isOpen,
  task,
  onClose,
  getUserName,
}: {
  isOpen: boolean
  task: UITask | null
  onClose: () => void
  getUserName: (id: any) => string
}) {
  if (!isOpen || !task) return null

  const priorityMap: Record<string, { label: string; cls: string }> = {
    high: { label: "Alta", cls: "bg-red-500" },
    medium: { label: "Media", cls: "bg-yellow-500" },
    low: { label: "Baja", cls: "bg-green-500" },
  }
  const statusMap: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-yellow-500" },
    "in-progress": { label: "En progreso", cls: "bg-orange-500" },
    completed: { label: "Completada", cls: "bg-green-600" },
    cancelled: { label: "Cancelada", cls: "bg-gray-400" },
  }

  const fmt = (d?: string | null) => {
    if (!d) return "-"
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return d
    return dt.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto text-gray-800">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-xl font-semibold">Detalle de tarea</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h4 className="text-lg font-semibold">{task.title}</h4>
            {task.description && <p className="text-gray-600 mt-1 whitespace-pre-wrap">{task.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm"><b>Asignado a:</b> {task.assignedTo ? getUserName(String(task.assignedTo)) : "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gray-500" />
              <span className="text-sm"><b>Departamento:</b> {task.department || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <span className="text-sm"><b>Prioridad:</b> <Badge className={`${priorityMap[task.priority]?.cls || "bg-gray-400"} text-white`}>{priorityMap[task.priority]?.label || task.priority}</Badge></span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <span className="text-sm"><b>Estado:</b> <Badge className={`${statusMap[task.status]?.cls || "bg-gray-400"} text-white`}>{statusMap[task.status]?.label || task.status}</Badge></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm"><b>Creada:</b> {fmt(task.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm"><b>Vence:</b> {fmt(task.dueDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm"><b>Completada:</b> {fmt(task.completedAt)}</span>
            </div>
          </div>

          {task.notes && (
            <div>
              <h5 className="font-medium mb-1">Notas</h5>
              <div className="text-sm text-gray-700 whitespace-pre-wrap border rounded p-3 bg-gray-50">{task.notes}</div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Cerrar</button>
        </div>
      </div>
    </div>
  )
}
