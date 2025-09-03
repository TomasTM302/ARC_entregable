"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import AuthGuard from "@/components/auth-guard"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuthStore()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    house: "",
    password: "",
    confirmPassword: "",
    role: "resident" as const,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    try {
      const { success, message } = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        house: formData.house,
        password: formData.password,
        role: formData.role,
      })

      if (success) {
        setSuccess("Usuario registrado exitosamente")
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          house: "",
          password: "",
          confirmPassword: "",
          role: "resident",
        })
      } else {
        setError(message || "Error al registrar usuario")
      }
    } catch (err) {
      setError("Ocurrió un error inesperado")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <header className="container mx-auto py-4">
          <Link href="/users" className="flex items-center text-white hover:text-gray-200">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver
          </Link>
        </header>

        <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Registrar Nuevo Usuario</h2>

            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {success && (
              <div
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4"
                role="alert"
              >
                <span className="block sm:inline">{success}</span>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Información personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Información Personal</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-medium">
                      Nombre(s)
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-medium">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium">
                      Número de teléfono
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="house" className="block text-sm font-medium">
                    Casa/Residencia
                  </label>
                  <input
                    type="text"
                    id="house"
                    value={formData.house}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    placeholder="Ej: Casa 42, Bloque A"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="block text-sm font-medium">
                    Rol
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  >
                    <option value="resident">Residente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Contraseña</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white py-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Registrando..." : "Registrar Usuario"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
