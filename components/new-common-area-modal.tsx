"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCommonAreasStore, type CommonArea } from "@/lib/common-areas-store"
import { toast } from "@/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface NewCommonAreaModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewCommonAreaModal({ isOpen, onClose }: NewCommonAreaModalProps) {
  const { addArea } = useCommonAreasStore()
  const [formData, setFormData] = useState<Partial<CommonArea>>({
    name: "",
    description: "",
    type: "common",
    icon: "utensils",
    deposit: 1000,
    operatingHours: "08:00 - 22:00",
    maxDuration: 4,
    maxPeople: 10,
    isActive: true,
    maxAdvanceBookingDays: 7,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "deposit" || name === "maxDuration" || name === "maxPeople" || name === "maxAdvanceBookingDays"
          ? Number.parseInt(value)
          : value,
    }))
  }

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as "common" | "private",
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }

    // Generar un ID único basado en el nombre
    const id = formData.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .concat("-", Math.floor(Math.random() * 1000).toString())

    const newArea: CommonArea = {
      id,
      name: formData.name!,
      description: formData.description!,
      type: formData.type as "common" | "private",
      icon: formData.icon || "utensils",
      deposit: formData.deposit || 1000,
      operatingHours: formData.operatingHours || "08:00 - 22:00",
      maxDuration: formData.maxDuration || 4,
      maxPeople: formData.maxPeople || 10,
      isActive: true,
      maxAdvanceBookingDays: formData.maxAdvanceBookingDays || 7,
    }

    addArea(newArea)

    toast({
      title: "Área creada",
      description: `El área "${newArea.name}" ha sido creada exitosamente.`,
    })

    // Resetear el formulario y cerrar el modal
    setFormData({
      name: "",
      description: "",
      type: "common",
      icon: "utensils",
      deposit: 1000,
      operatingHours: "08:00 - 22:00",
      maxDuration: 4,
      maxPeople: 10,
      isActive: true,
      maxAdvanceBookingDays: 7,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar nueva área común</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del área *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Salón de fiestas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe el área común..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de área</Label>
              <RadioGroup value={formData.type as string} onValueChange={handleTypeChange} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="common" id="common" />
                  <Label htmlFor="common">Común</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private">Privada</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deposit">Depósito ($)</Label>
                <Input
                  id="deposit"
                  name="deposit"
                  type="number"
                  value={formData.deposit}
                  onChange={handleChange}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDuration">Duración máxima (horas)</Label>
                <Input
                  id="maxDuration"
                  name="maxDuration"
                  type="number"
                  value={formData.maxDuration}
                  onChange={handleChange}
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPeople">Capacidad máxima</Label>
                <Input
                  id="maxPeople"
                  name="maxPeople"
                  type="number"
                  value={formData.maxPeople}
                  onChange={handleChange}
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAdvanceBookingDays">Anticipación máxima (días)</Label>
                <Input
                  id="maxAdvanceBookingDays"
                  name="maxAdvanceBookingDays"
                  type="number"
                  value={formData.maxAdvanceBookingDays}
                  onChange={handleChange}
                  min={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operatingHours">Horario de operación</Label>
              <Input
                id="operatingHours"
                name="operatingHours"
                value={formData.operatingHours}
                onChange={handleChange}
                placeholder="Ej: 08:00 - 22:00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icono</Label>
              <Input
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="Nombre del icono"
              />
              <p className="text-xs text-gray-500">
                Opciones: utensils, waves, glass-water, users, umbrella-beach, etc.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="destructive" className="text-white" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Crear área
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
