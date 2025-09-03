"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import ImageUpload from "@/components/image-upload"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/lib/auth"


export default function Page() {
  const router = useRouter()
  const { user } = useAuthStore()
  // Ya no usamos el store local para avisos
  const [formData, setFormData] = useState({
    petName: "",
    petType: "",
    petBreed: "",
    petColor: "",
    characteristics: "",
    lostDate: "",
    lostTime: "",
    lostLocation: "",
    details: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  })
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Añadir un estado para manejar errores
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    // Extract the field name without the prefix
    const fieldName = id.split("-").pop() || ""
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  // Modificar la función handleSubmit para actualizar las validaciones
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validar campos mínimos requeridos
      const requiredFields = [
        { field: "petName", message: "El nombre de la mascota es obligatorio" },
        { field: "petType", message: "El tipo de mascota es obligatorio" },
        { field: "petColor", message: "El color de la mascota es obligatorio" },
        { field: "lostLocation", message: "El lugar donde se perdió es obligatorio" },
        { field: "lostDate", message: "La fecha de pérdida es obligatoria" },
      ]

      for (const { field, message } of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          throw new Error(message)
        }
      }

      // Validar que haya al menos un método de contacto
      if (!formData.contactName && !formData.contactPhone && !formData.contactEmail) {
        throw new Error("Debe proporcionar al menos un método de contacto (nombre, teléfono o email)")
      }

      // Preparar el payload para el aviso SQL
      const pad = (n: number) => n.toString().padStart(2, '0')
      const now = new Date()
      const fecha_publicacion = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

      // Título y contenido ordenados
      const titulo = `Mascota extraviada: ${formData.petName}`
      const contenido = [
        `Tipo: ${formData.petType}`,
        formData.petBreed ? `Raza: ${formData.petBreed}` : null,
        `Color: ${formData.petColor}`,
        formData.characteristics ? `Características: ${formData.characteristics}` : null,
        `Fecha de pérdida: ${formData.lostDate}${formData.lostTime ? ' ' + formData.lostTime : ''}`,
        `Lugar: ${formData.lostLocation}`,
        formData.details ? `Detalles: ${formData.details}` : null,
        `Contacto: ${[formData.contactName, formData.contactPhone, formData.contactEmail].filter(Boolean).join(' / ')}`
      ].filter(Boolean).join('\n')

      // Imagen principal (opcional)
      const imagen_url = images.length > 0 ? images[0] : null

      // importante: 'mascota_extraviada'
      const avisoPayload = {
        titulo,
        contenido,
        fecha_publicacion,
        imagen_url,
        importante: 'mascota_extraviada',
        autor_id: user?.id || null,
        condominio_id: user?.condominiumId || null,
      }

      // Enviar a la API SQL
      const res = await fetch("/api/avisos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(avisoPayload)
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || "Error al guardar el aviso")

      // Redireccionar a avisos con éxito
      router.push("/avisos?success=true")
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Error al enviar el formulario")
      }
      setIsSubmitting(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Mock function for image upload component
  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages)
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#0e2c52] pb-20">
      <header className="container mx-auto py-4 px-4 max-w-7xl">
        <Link href="/home" className="flex items-center text-white hover:text-gray-200">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Volver al inicio
        </Link>
      </header>
      <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
        {/* Añadir el componente de mensaje de error después del título del formulario */}
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 mb-8 mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center">Reportar Mascota Extraviada</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <p className="text-sm text-blue-700">
                Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
              </p>
            </div>
            {/* Información de la mascota */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Información de la Mascota</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="petName" className="block text-sm font-medium">
                    Nombre de la mascota <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="petName"
                    value={formData.petName}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="petType" className="block text-sm font-medium">
                    Tipo de mascota <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="petType"
                    value={formData.petType}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Ave">Ave</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="petBreed" className="block text-sm font-medium">
                    Raza
                  </label>
                  <input
                    type="text"
                    id="petBreed"
                    value={formData.petBreed}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="petColor" className="block text-sm font-medium">
                    Color <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="petColor"
                    value={formData.petColor}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="characteristics" className="block text-sm font-medium">
                  Características distintivas
                </label>
                <textarea
                  id="characteristics"
                  value={formData.characteristics}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                  placeholder="Marcas, cicatrices, comportamiento, etc."
                ></textarea>
              </div>
            </div>

            {/* Información de la pérdida */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Información de la Pérdida</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="lostDate" className="block text-sm font-medium">
                    Fecha de pérdida <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="lostDate"
                    value={formData.lostDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="lostTime" className="block text-sm font-medium">
                    Hora aproximada
                  </label>
                  <input
                    type="time"
                    id="lostTime"
                    value={formData.lostTime}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="lostLocation" className="block text-sm font-medium">
                  Lugar donde se perdió <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lostLocation"
                  value={formData.lostLocation}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                  placeholder="Dirección o referencia"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="details" className="block text-sm font-medium">
                  Detalles adicionales
                </label>
                <textarea
                  id="details"
                  value={formData.details}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                  placeholder="Circunstancias de la pérdida, última vez visto, etc."
                ></textarea>
              </div>
            </div>

            {/* Subir imágenes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Fotografías</h3>
              <p className="text-sm text-gray-500 mb-2">
                Las fotografías son opcionales, pero ayudan a identificar a la mascota.
              </p>
              <ImageUpload maxFiles={5} maxSize={5} folder="mascotas" onImagesChange={handleImagesChange} />

              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Foto ${idx + 1}`}
                        className="h-24 w-full object-cover rounded-md border"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información de contacto */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">
                Información de Contacto <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-500 mb-2">Proporcione al menos un método de contacto.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="contactName" className="block text-sm font-medium">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="contactPhone" className="block text-sm font-medium">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="contactEmail" className="block text-sm font-medium">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e8f0fe] text-gray-800"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-[#e8f0fe] text-[#0e2c52] hover:bg-[#d8e0ee] py-6 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Reportar Mascota Extraviada"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
