"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

/*
  Sugerencia de campos para la futura tabla "proveedores":
    - id (PK)
    - empresa          nombre del negocio o compañía
    - contacto         persona responsable
    - telefono
    - email
    - tipo_servicio    giro o especialidad
    - descripcion      información de los servicios
    - direccion        ubicación física
    - sitio_web        url opcional
    - fecha_registro   timestamp de alta
*/

export default function AltaProveedoresPage() {
  const [formData, setFormData] = useState({
    empresa: "",
    contacto: "",
    telefono: "",
    email: "",
    tipo: "",
    descripcion: "",
    website: "",
  })
  const [enviado, setEnviado] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Datos del proveedor", formData)
    setEnviado(true)
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#0e2c52] py-8">
      <section className="container mx-auto flex-1 flex flex-col items-center justify-start">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Registro de Proveedores</h2>

          {enviado ? (
            <p className="text-center text-green-700">
              Datos enviados correctamente. Nos pondremos en contacto pronto.
            </p>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="empresa" className="block text-sm font-medium">
                  Empresa o Negocio
                </label>
                <input
                  type="text"
                  id="empresa"
                  value={formData.empresa}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contacto" className="block text-sm font-medium">
                  Nombre de contacto
                </label>
                <input
                  type="text"
                  id="contacto"
                  value={formData.contacto}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="telefono" className="block text-sm font-medium">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tipo" className="block text-sm font-medium">
                  Tipo de servicio
                </label>
                <input
                  type="text"
                  id="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="descripcion" className="block text-sm font-medium">
                  Descripción del servicio
                </label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                ></textarea>
              </div>

              <div className="space-y-2">
                <label htmlFor="website" className="block text-sm font-medium">
                  Sitio web (opcional)
                </label>
                <input
                  type="url"
                  id="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                />
              </div>

              <Button type="submit" className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white py-3">
                Enviar solicitud
              </Button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
