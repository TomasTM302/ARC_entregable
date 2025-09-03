"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/auth"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface RegisterUserModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function RegisterUserModal({ isOpen, onClose }: RegisterUserModalProps) {
  const { register } = useAuthStore()
  const [condominiums, setCondominiums] = useState<{ id: number, name: string }[]>([])
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    house: "",
    condominiumId: "",
    password: "",
    confirmPassword: "",
    role: "resident",
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableProperties, setAvailableProperties] = useState<{ id: number, numero: string }[]>([])

  useEffect(() => {
    if (isOpen) {
      fetch("/api/condominios")
        .then(res => res.json())
        .then(data => {
          if (data.success) setCondominiums(data.condominiums)
        })
    }
  }, [isOpen])

  useEffect(() => {
    if (formData.condominiumId && formData.role === 'resident') {
      fetch(`/api/propiedades-disponibles?condominioId=${formData.condominiumId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setAvailableProperties(data.propiedades)
          else setAvailableProperties([])
        })
    } else {
      setAvailableProperties([])
    }
  }, [formData.condominiumId, formData.role])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    // Si cambia el condominio, limpiar la casa
    if (name === 'condominiumId') {
      setFormData((prev) => ({ ...prev, [name]: value, house: '' }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        house: formData.house,
        condominiumId: formData.condominiumId,
        password: formData.password,
        role: formData.role as "admin" | "resident" | "vigilante" | "mantenimiento",
      })

      if (result.success) {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          house: "",
          condominiumId: "",
          password: "",
          confirmPassword: "",
          role: "resident",
        })
        onClose()
      } else {
        setError(result.message || "Error al registrar usuario")
      }
    } catch (err) {
      setError("Error al registrar usuario")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condominium">Condominio</Label>
            <select
              id="condominium"
              name="condominiumId"
              value={formData.condominiumId}
              onChange={handleChange as any}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              required={formData.role === 'resident'}
            >
              <option value="">Seleccionar condominio</option>
              {condominiums.map((condo) => (
                <option key={condo.id} value={condo.id}>
                  {condo.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="house">Casa/Departamento</Label>
            {formData.role === 'resident' ? (
              <select
                id="house"
                name="house"
                value={formData.house}
                onChange={handleChange as any}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                <option value="">Seleccionar propiedad</option>
                {availableProperties.map((prop) => (
                  <option key={prop.id} value={prop.numero}>{prop.numero}</option>
                ))}
              </select>
            ) : (
              <Input
                id="house"
                name="house"
                value={formData.house}
                onChange={handleChange}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <RadioGroup value={formData.role} onValueChange={handleRoleChange} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="resident" id="resident" />
                <Label htmlFor="resident">Residente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vigilante" id="vigilante" />
                <Label htmlFor="vigilante">Vigilante</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mantenimiento" id="mantenimiento" />
                <Label htmlFor="mantenimiento">Mantenimiento</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin">Admin</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="destructive" className="text-white" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
