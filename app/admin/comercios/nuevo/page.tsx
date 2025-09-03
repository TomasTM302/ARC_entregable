"use client"

import type React from "react"

import { useState } from "react"
import { Save, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import AuthGuard from "@/components/auth-guard"
import { useRouter } from "next/navigation"

export default function NuevoComercioPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    websiteUrl: "",
    imageUrl: "/placeholder.svg?height=200&width=200", // URL de imagen predeterminada (solo preview)
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // En una aplicación real, aquí subirías la imagen a un servidor
      // y obtendrías la URL. Para esta demo, usamos una URL local temporal
      const imageUrl = URL.createObjectURL(file)
      setPreviewImage(imageUrl)

      // En una aplicación real, aquí asignarías la URL del servidor
      // setFormData(prev => ({ ...prev, imageUrl: urlDelServidor }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validar campos
      if (!formData.name.trim()) {
        throw new Error("El nombre es obligatorio")
      }

      if (!formData.category.trim()) {
        throw new Error("La categoría es obligatoria")
      }

      // Validar formato de URL solo si el usuario proporcionó una
      if (formData.websiteUrl.trim()) {
        try {
          // Lanza si no es URL válida
          new URL(formData.websiteUrl)
        } catch (error) {
          throw new Error("La URL del sitio web no es válida")
        }
      }

      // No enviar object URLs (blob:) al backend; solo usar imageUrl si es una URL válida y no es placeholder
      let finalImageUrl: string | null = null
      const img = (formData.imageUrl || "").trim()
      const isPlaceholder = img.includes("/placeholder.svg")
      if (img && !isPlaceholder) {
        try {
          new URL(img)
          finalImageUrl = img
        } catch {
          finalImageUrl = null
        }
      }
      if (!user) throw new Error("No se pudo identificar al usuario")
      const payload = {
        nombre: formData.name,
        categoria: formData.category,
        sitio_web: formData.websiteUrl.trim() ? formData.websiteUrl.trim() : null,
        logo_url: finalImageUrl,
        condominio_id: user.condominiumId ?? null,
        activo: 1,
      }
      const res = await fetch("/api/comercios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || "No se pudo crear el comercio")
      router.push("/admin/comercios")
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Ocurrió un error al crear el comercio")
      }
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <section className="container mx-auto flex-1 flex flex-col items-start justify-start py-6 px-4">
          <div className="w-full mb-8">
            <h1 className="text-3xl font-bold text-white">Nuevo Comercio</h1>
            <p className="text-gray-300 mt-2">Añade un nuevo comercio cercano al residencial.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md w-full max-w-2xl mx-auto">
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre del comercio <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  placeholder="Ej: Supermercado El Ahorro"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Categoría <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  placeholder="Ej: Supermercado, Farmacia, Restaurante"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700">
                  URL del sitio web
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  placeholder="https://www.ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Imagen</label>
                <div className="mt-1 flex items-center">
                  <div className="relative">
                    {previewImage ? (
                      <img
                        src={previewImage || "/placeholder.svg"}
                        alt="Vista previa"
                        className="h-32 w-32 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-32 w-32 bg-gray-100 rounded-md flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer">
                    Seleccionar imagen
                    <input type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  Imagen representativa del comercio. Tamaño recomendado: 800x600 píxeles.
                </p>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => router.push("/admin/comercios")}
                  className="text-white"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#3b6dc7] hover:bg-[#2d5db3] text-white" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Guardando..." : "Guardar Comercio"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
