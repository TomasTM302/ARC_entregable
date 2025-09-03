"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useCommonAreasStore, type CommonArea } from "@/lib/common-areas-store"
import { toast } from "@/components/ui/use-toast"

interface EditAreaModalProps {
  isOpen: boolean
  onClose: () => void
  area: CommonArea
}

export default function EditAreaModal({ isOpen, onClose, area }: EditAreaModalProps) {
  const { updateArea } = useCommonAreasStore()

  const [formData, setFormData] = useState({
    name: area.name,
    deposit: area.deposit,
    operatingHours: area.operatingHours,
    maxDuration: area.maxDuration,
    maxPeople: area.maxPeople,
    maxAdvanceBookingDays: area.maxAdvanceBookingDays,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "name" ? value : Number(value),
    }))
  }

  const handleOperatingHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: e.target.value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate operating hours format
    const hoursRegex = /^\d{2}:\d{2} - \d{2}:\d{2}$/
    if (!hoursRegex.test(formData.operatingHours)) {
      toast({
        title: "Formato incorrecto",
        description: "El formato de horario debe ser HH:MM - HH:MM",
        variant: "destructive",
      })
      return
    }

    updateArea(area.id, {
      name: formData.name,
      deposit: formData.deposit,
      operatingHours: formData.operatingHours,
      maxDuration: formData.maxDuration,
      maxPeople: formData.maxPeople,
      maxAdvanceBookingDays: formData.maxAdvanceBookingDays,
    })

    toast({
      title: "Área actualizada",
      description: `Los datos de ${formData.name} han sido actualizados correctamente.`,
    })

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar {area.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit">Depósito reembolsable ($)</Label>
              <Input
                id="deposit"
                name="deposit"
                type="number"
                min="0"
                value={formData.deposit}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="operatingHours">Horario de operación (formato: HH:MM - HH:MM)</Label>
              <Input
                id="operatingHours"
                name="operatingHours"
                value={formData.operatingHours}
                onChange={handleOperatingHoursChange}
                placeholder="08:00 - 22:00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDuration">Duración máxima (horas)</Label>
                <Input
                  id="maxDuration"
                  name="maxDuration"
                  type="number"
                  min="1"
                  max="24"
                  value={formData.maxDuration}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPeople">Capacidad máxima (personas)</Label>
                <Input
                  id="maxPeople"
                  name="maxPeople"
                  type="number"
                  min="1"
                  value={formData.maxPeople}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAdvanceBookingDays">Días máximos de anticipación</Label>
              <Input
                id="maxAdvanceBookingDays"
                name="maxAdvanceBookingDays"
                type="number"
                min="1"
                max="365"
                value={formData.maxAdvanceBookingDays}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="destructive" onClick={onClose} className="text-white">
              Cancelar
            </Button>
            <Button type="submit" className="text-white">
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
