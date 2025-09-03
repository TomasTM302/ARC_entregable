"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { X, Save, Store, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EditBusinessModalProps {
  isOpen: boolean
  onClose: () => void
  business: any | null
  onUpdated?: (updated: any) => void
}

export default function EditBusinessModal({ isOpen, onClose, business, onUpdated }: EditBusinessModalProps) {
  const CATEGORY_OPTIONS = [
    { value: "restaurant", label: "Restaurante" },
    { value: "supermarket", label: "Supermercado" },
    { value: "pharmacy", label: "Farmacia" },
    { value: "bakery", label: "Panadería" },
    { value: "cafe", label: "Café" },
    { value: "gym", label: "Gimnasio" },
    { value: "beauty", label: "Salón de belleza" },
    { value: "other", label: "Otro" },
  ] as const

  const normalizeCategory = (raw: string | undefined | null): string => {
    if (!raw) return "other"
    const s = String(raw).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    if (s.includes("restaur")) return "restaurant"
    if (s.includes("super")) return "supermarket"
    if (s.includes("farmac")) return "pharmacy"
    if (s.includes("panad") || s.includes("bak")) return "bakery"
    if (s.includes("cafe")) return "cafe"
    if (s.includes("gimn") || s.includes("gym")) return "gym"
    if (s.includes("belleza") || s.includes("beaut")) return "beauty"
    return "other"
  }

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    category: "",
    address: "",
    phone: "",
    email: "",
    websiteUrl: "",
    description: "",
    imageUrl: "/placeholder.svg?height=200&width=200",
    discount: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (business && isOpen) {
      const catNorm = normalizeCategory(business.category ?? business.categoria)
      setFormData({
        id: String(business.id ?? ""),
        name: business.name ?? "",
        category: catNorm,
        address: business.address ?? business.direccion ?? "",
        phone: business.phone ?? business.telefono ?? "",
        email: business.email ?? "",
        websiteUrl: business.websiteUrl ?? business.sitio_web ?? "",
        description: business.description ?? business.descripcion ?? "",
        imageUrl: business.imageUrl ?? business.logo_url ?? "/placeholder.svg?height=200&width=200",
        discount: business.discount ?? business.descuento ?? "",
      })
      setError(null)
      setSuccess(null)
    }
  }, [business, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id) return
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const payload: Record<string, any> = {}
      // Solo enviar campos presentes
      if (formData.name) payload["nombre"] = formData.name
  if (formData.category) payload["categoria"] = formData.category
      payload["direccion"] = formData.address || null
      payload["telefono"] = formData.phone || null
      payload["email"] = formData.email || null
      payload["sitio_web"] = formData.websiteUrl || null
      payload["logo_url"] = formData.imageUrl || null
      payload["descripcion"] = formData.description || null
      payload["descuento"] = formData.discount || null

      const res = await fetch(`/api/comercios/${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || "No se pudo actualizar el comercio")

      setSuccess("Comercio actualizado exitosamente")
      setIsSubmitting(false)
      try {
        const { id, ...rest } = formData
        onUpdated?.({ id, ...rest })
      } catch {}
      setTimeout(() => {
        onClose()
        setSuccess(null)
      }, 800)
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al actualizar el comercio")
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !business) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Editar Comercio</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del comercio <span className="text-red-500" aria-hidden="true">*</span></label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría <span className="text-red-500" aria-hidden="true">*</span></label>
              <select
                id="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700">Sitio web</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="url"
                  id="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="discount" className="block text-sm font-medium text-gray-700">Descuento</label>
            <input
              id="discount"
              value={formData.discount}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Imagen (URL)</label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="destructive" onClick={onClose} className="text-white" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#3b6dc7] hover:bg-[#2d5db3] text-white" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
