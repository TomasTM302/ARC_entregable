"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuxiliarTasksStore } from "@/lib/auxiliar-tasks-store"
import { useAuthStore } from "@/lib/auth"

interface NewAuxiliarTaskModalProps {
  isOpen: boolean
  onClose: () => void
}

// Lista de secciones disponibles
const SECTIONS = [
  "Torre A",
  "Torre B",
  "Torre C",
  "Área Común",
  "Estacionamiento",
  "Jardines",
  "Alberca",
  "Gimnasio",
  "Salón de eventos",
]

// Lista de condominios disponibles
const CONDOMINIUMS = [
  "Condominio 1-Los Arcos",
  "Condominio 2-Las Palmas",
  "Condominio 3-Vista Hermosa",
  "Condominio 4-El Mirador",
]

export default function NewAuxiliarTaskModal({ isOpen, onClose }: NewAuxiliarTaskModalProps) {
  const { addTask } = useAuxiliarTasksStore()
  const { user, users } = useAuthStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [assignedTo, setAssignedTo] = useState("")
  const [section, setSection] = useState("")
  const [condominium, setCondominium] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Obtener auxiliares
  const auxiliares = users.filter((user) => user.role === "mantenimiento")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !assignedTo || !user || !section || !condominium) return

    setIsSubmitting(true)

    addTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      status: "pending",
      assignedTo,
      assignedBy: user.id,
      section, // Añadir la sección seleccionada
      condominium, // Añadir el condominio seleccionado
    })

    setIsSubmitting(false)
    setTitle("")
    setDescription("")
    setPriority("medium")
    setAssignedTo("")
    setSection("")
    setCondominium("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[650px] max-h-[95vh] overflow-y-auto p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold">Nueva Tarea para Auxiliar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-3">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-lg">
              Título
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la tarea"
              required
              className="bg-gray-200 text-black p-3 text-lg"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="description" className="text-lg">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción detallada de la tarea..."
              className="bg-gray-200 text-black min-h-[120px] p-3 text-lg"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-lg">Prioridad</Label>
            <div className="flex space-x-4">
              <div
                className={`flex-1 p-4 rounded-md cursor-pointer flex items-center justify-center text-lg font-medium ${
                  priority === "low" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setPriority("low")}
              >
                Baja
              </div>
              <div
                className={`flex-1 p-4 rounded-md cursor-pointer flex items-center justify-center text-lg font-medium ${
                  priority === "medium" ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setPriority("medium")}
              >
                Media
              </div>
              <div
                className={`flex-1 p-4 rounded-md cursor-pointer flex items-center justify-center text-lg font-medium ${
                  priority === "high" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setPriority("high")}
              >
                Alta
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Label htmlFor="condominium" className="text-lg">
              Condominio
            </Label>
            <select
              id="condominium"
              value={condominium}
              onChange={(e) => setCondominium(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-200 text-black text-lg"
              required
            >
              <option value="">Seleccionar condominio</option>
              {CONDOMINIUMS.map((condo) => (
                <option key={condo} value={condo}>
                  {condo}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <Label htmlFor="section" className="text-lg">
              Sección
            </Label>
            <select
              id="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-200 text-black text-lg"
              required
            >
              <option value="">Seleccionar sección</option>
              {SECTIONS.map((sect) => (
                <option key={sect} value={sect}>
                  {sect}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <Label htmlFor="assignedTo" className="text-lg">
              Asignar a
            </Label>
            <select
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-200 text-black text-lg"
              required
            >
              <option value="">Seleccionar auxiliar</option>
              {auxiliares.map((auxiliar) => (
                <option key={auxiliar.id} value={auxiliar.id}>
                  {auxiliar.firstName} {auxiliar.lastName}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={onClose}
              className="text-white text-lg p-6 h-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg p-6 h-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Crear Tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
