"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/auth"
import { useParams } from "next/navigation"

export default function NewTaskModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [estado, setEstado] = useState("pendiente")
  const [dueDate, setDueDate] = useState("")
  const [areaComunId, setAreaComunId] = useState("")
  const [evidenciaUrl, setEvidenciaUrl] = useState("")
  const [notas, setNotas] = useState("")
  const { id: condominio_id } = useParams()
  const { user } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const payload = {
      title,
      description,
      assignedTo: user?.id,
      assignedBy: user?.id,
      priority,
      estado,
      condominiumId: condominio_id,
      sectionId: areaComunId || null,
      dueDate: dueDate || null,
      evidenceUrl: evidenciaUrl || null,
      notas,
    }
    try {
      const res = await fetch("/api/personal_mantenimiento/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTitle("")
        setDescription("")
        setPriority("medium")
        setEstado("pendiente")
        setDueDate("")
        setAreaComunId("")
        setEvidenciaUrl("")
        setNotas("")
        onClose()
      }
    } catch (err) {
      // Manejo de error
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Actividad / Tarea de Mantenimiento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la tarea"
              className="bg-gray-200 text-black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción detallada"
              className="bg-gray-200 text-black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="areaComunId">Área común</Label>
            <Input
              id="areaComunId"
              value={areaComunId}
              onChange={(e) => setAreaComunId(e.target.value)}
              placeholder="ID del área común (opcional)"
              className="bg-gray-200 text-black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <select
              id="estado"
              value={estado}
              onChange={e => setEstado(e.target.value)}
              className="bg-gray-200 text-black w-full p-2 rounded"
            >
              <option value="pendiente">Pendiente</option>
              <option value="in_progreso">En progreso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridad</Label>
            <select
              id="priority"
              value={priority}
              onChange={e => setPriority(e.target.value as "low" | "medium" | "high")}
              className="bg-gray-200 text-black w-full p-2 rounded"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Fecha vencimiento</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="bg-gray-200 text-black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evidenciaUrl">Evidencia URL</Label>
            <Input
              id="evidenciaUrl"
              value={evidenciaUrl}
              onChange={(e) => setEvidenciaUrl(e.target.value)}
              placeholder="URL de evidencia (opcional)"
              className="bg-gray-200 text-black"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas adicionales (opcional)"
              className="bg-gray-200 text-black"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={onClose}
              className="text-white"
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Crear Tarea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
