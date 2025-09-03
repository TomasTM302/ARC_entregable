"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, AlertTriangle, Wrench, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
// Store eliminado
import { useAuthStore } from "@/lib/auth"
import { useRouter } from "next/navigation"
import AuthGuard from "@/components/auth-guard"

export default function CrearAvisoPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "general",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validar campos
      if (!formData.title.trim()) {
        throw new Error("El título es obligatorio")
      }

      if (!formData.description.trim()) {
        throw new Error("La descripción es obligatoria")
      }

      // Mapear tipo a valores usados por API
      let importante = formData.type
      if (importante === "emergency") importante = "emergencia"
      if (importante === "maintenance") importante = "mantenimiento"

      // Construir payload básico
      const now = new Date()
      const pad = (n: number) => n.toString().padStart(2, "0")
      const fecha_publicacion = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

      const payload = {
        titulo: formData.title,
        contenido: formData.description,
        autor_id: user?.id || null,
        condominio_id: user?.condominiumId || null,
        fecha_publicacion,
        fecha_expiracion: null,
        imagen_url: null,
        importante,
      }

      const res = await fetch("/api/avisos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) throw new Error(data?.message || "Error al crear el aviso")

      router.push("/avisos?success=true&from=admin")
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Ocurrió un error al crear el aviso")
      }
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emergency":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "maintenance":
        return <Wrench className="h-5 w-5 text-yellow-500" />
      default:
        return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52] pb-20">
        <header className="container mx-auto py-4">
          <Link href="/avisos" className="flex items-center text-white hover:text-gray-200">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver a Avisos
          </Link>
        </header>

        <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Crear Nuevo Aviso</h2>

            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="type" className="block text-sm font-medium">
                  Tipo de aviso
                </label>
                <div className="flex items-center space-x-2">
                  {getTypeIcon(formData.type)}
                  <select
                    id="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7]"
                  >
                    <option value="general">General</option>
                    <option value="emergency">Emergencia</option>
                    <option value="maintenance">Mantenimiento</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium">
                  Título
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7]"
                  placeholder="Título del aviso"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium">
                  Descripción
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7]"
                  placeholder="Descripción detallada del aviso"
                  required
                ></textarea>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white py-3"
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Guardando..." : "Publicar Aviso"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
