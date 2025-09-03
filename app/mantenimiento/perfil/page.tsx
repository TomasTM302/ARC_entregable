"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Phone, Mail, Home } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AuxiliarPerfilPage() {
  const { user, isAuthenticated, isMantenimiento } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !isMantenimiento) {
      router.push("/home")
    }
  }, [isAuthenticated, isMantenimiento, router])

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    house: user?.house || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para actualizar el perfil
    alert("Perfil actualizado correctamente")
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para cambiar la contraseña
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }
    alert("Contraseña actualizada correctamente")
  }

  return (
    <div className="bg-white rounded-lg p-4 w-full text-gray-800 pb-16">
      <h2 className="text-xl font-semibold mb-4">Mi Perfil</h2>

      <div className="space-y-6">
        {/* Información personal */}
        <div className="space-y-4">
          <h3 className="text-base font-medium border-b pb-2">Información Personal</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="pl-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="house">Área</Label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input id="house" name="house" value={formData.house} onChange={handleChange} className="pl-10" />
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white">
              Guardar Cambios
            </Button>
          </form>
        </div>

        {/* Cambiar contraseña */}
        <div className="space-y-4">
          <h3 className="text-base font-medium border-b pb-2">Cambiar Contraseña</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white">
              Cambiar Contraseña
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
