"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useMantenimientoTasksStore } from "@/lib/mantenimiento-tasks-store"
import { useAuthStore } from "@/lib/auth"
import { DatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"

// Mapeo de IDs de URL a nombres de condominios
const CONDOMINIUM_ID_MAP: Record<string, string> = {
  "condo-1": "Condominio 1-Los Arcos",
  "condo-2": "Condominio 2-Las Palmas",
  "condo-3": "Condominio 3-Vista Hermosa",
  "condo-4": "Condominio 4-El Mirador",
  "los-arcos": "Condominio 1-Los Arcos",
  "las-palmas": "Condominio 2-Las Palmas",
  "vista-hermosa": "Condominio 3-Vista Hermosa",
  "el-mirador": "Condominio 4-El Mirador",
}

interface AddReminderModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedCondominium?: string
}

export default function AddReminderModal({ isOpen, onClose, preselectedCondominium }: AddReminderModalProps) {
  const { addTask } = useMantenimientoTasksStore()
  const { user } = useAuthStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [condominium, setCondominium] = useState("")

  useEffect(() => {
    if (preselectedCondominium && isOpen) {
      // Mapear el ID del condominio al nombre completo
      const mappedCondominium = CONDOMINIUM_ID_MAP[preselectedCondominium.toLowerCase()] || preselectedCondominium
      console.log("=== DEBUG ADD REMINDER MODAL ===")
      console.log("preselectedCondominium recibido:", preselectedCondominium)
      console.log("mappedCondominium:", mappedCondominium)

      setCondominium(mappedCondominium)
      console.log("Estableciendo condominium a:", mappedCondominium)
    }
  }, [preselectedCondominium, isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!title.trim() || !user) return

    setIsSubmitting(true)
    try {
      await addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        assignedTo: user.id,
        assignedBy: user.id,
        isPersonalReminder: true,
        condominiumId: undefined,
        sectionId: undefined,
        dueDate: dueDate ? dueDate.toISOString().slice(0,10) : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
    setTitle("")
    setDescription("")
    setPriority("medium")
    setDueDate(undefined)
  setCondominium("")
    onClose()
  }

  const handleDateChange = (date: Date) => {
    setDueDate(date)
    setShowDatePicker(false)
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
          <DialogTitle className="text-xl pr-8">Agregar Recordatorio Personal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm">
              Título
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del recordatorio"
              className="bg-gray-200 text-black text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción detallada del recordatorio..."
              className="bg-gray-200 text-black text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Prioridad</Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                className={`flex-1 text-sm py-2 ${
                  priority === "low" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setPriority("low")}
              >
                Baja
              </Button>
              <Button
                type="button"
                className={`flex-1 text-sm py-2 ${
                  priority === "medium" ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setPriority("medium")}
              >
                Media
              </Button>
              <Button
                type="button"
                className={`flex-1 text-sm py-2 ${
                  priority === "high" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setPriority("high")}
              >
                Alta
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Fecha límite</Label>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className={`w-full justify-start text-left font-normal text-base text-black ${
                  !dueDate ? "text-gray-500" : ""
                } bg-gray-200`}
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>

              {showDatePicker && (
                <div className="absolute z-50 mt-1 w-full">
                  <DatePicker
                    selectedDate={dueDate}
                    onDateChange={handleDateChange}
                    minDate={new Date()}
                    className="border border-gray-300"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condominium" className="text-sm">
              Condominio
            </Label>
            <select
              value={condominium}
              onChange={(e) => setCondominium(e.target.value)}
              disabled={!!preselectedCondominium}
              className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                preselectedCondominium ? "opacity-50 cursor-not-allowed" : ""
              }`}
              key={`condominium-${preselectedCondominium || "default"}`}
            >
              <option value="">Seleccionar condominio</option>
              <option value="Condominio 1-Los Arcos">Los Arcos</option>
              <option value="Condominio 2-Las Palmas">Las Palmas</option>
              <option value="Condominio 3-El Mirador">El Mirador</option>
              <option value="Condominio 4-Vista Hermosa">Vista Hermosa</option>
            </select>
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
              className="w-full sm:w-auto bg-[#3b6dc7] hover:bg-[#2d5db3] text-white"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? "Guardando..." : "Guardar Recordatorio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
