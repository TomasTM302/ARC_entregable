"use client"

import type React from "react"

import { useState } from "react"
import { Save, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import AuthGuard from "@/components/auth-guard"
import { useRouter } from "next/navigation"

export default function NuevaMultaPage() {
  const router = useRouter()
  const { getUsers } = useAuthStore()
  const users = getUsers()

  const [formData, setFormData] = useState({
    userId: "",
    reason: "",
    amount: "",
    dueDate: "",
    lateFee: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate form
    if (!formData.userId) {
      alert("Por favor seleccione un usuario")
      setIsSubmitting(false)
      return
    }

    if (!formData.reason) {
      alert("Por favor ingrese el motivo de la multa")
      setIsSubmitting(false)
      return
    }

    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      alert("Por favor ingrese un monto válido")
      setIsSubmitting(false)
      return
    }

    if (!formData.dueDate) {
      alert("Por favor seleccione una fecha de vencimiento")
      setIsSubmitting(false)
      return
    }

    if (!formData.lateFee || isNaN(Number(formData.lateFee)) || Number(formData.lateFee) < 0) {
      alert("Por favor ingrese un recargo válido")
      setIsSubmitting(false)
      return
    }

    // Validate that due date is in the future
    const dueDate = new Date(formData.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time part for proper comparison

    if (dueDate < today) {
      alert("La fecha de vencimiento debe ser futura")
      setIsSubmitting(false)
      return
    }

    // In a real app, you would save the data to your backend here
    console.log("Multa creada:", {
      ...formData,
      amount: Number(formData.amount),
      lateFee: Number(formData.lateFee),
      status: "pending",
      createdAt: new Date().toISOString(),
    })

    // Show success message
    setSuccess("Multa creada exitosamente")

    // Redirect to multas list after 2 seconds
    setTimeout(() => {
      router.push("/admin/multas")
    }, 2000)
  }

  // Calculate minimum date for due date (today)
  const today = new Date()
  const minDate = today.toISOString().split("T")[0]

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <section className="container mx-auto flex-1 flex flex-col items-start justify-start py-6 px-4">
          <div className="w-full mb-8">
            <h1 className="text-3xl font-bold text-white">Nueva Multa</h1>
            <p className="text-gray-300 mt-2">Registra una nueva multa para un residente.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md w-full max-w-2xl mx-auto">
            {success && (
              <div
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
                role="alert"
              >
                <span className="block sm:inline">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selección de usuario */}
              <div className="space-y-2">
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                  Residente
                </label>
                <select
                  id="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  required
                >
                  <option value="">Seleccionar residente</option>
                  {users
                    .filter((user) => user.role === "resident")
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} - {user.house}
                      </option>
                    ))}
                </select>
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  Motivo de la multa
                </label>
                <textarea
                  id="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  placeholder="Describa el motivo de la multa"
                  required
                ></textarea>
              </div>

              {/* Monto */}
              <div className="space-y-2">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <input
                    type="text"
                    id="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Fecha de vencimiento */}
              <div className="space-y-2">
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  Fecha de vencimiento
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="date"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    min={minDate}
                    className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Fecha límite para pagar sin recargo adicional</p>
              </div>

              {/* Recargo por pago extemporáneo */}
              <div className="space-y-2">
                <label htmlFor="lateFee" className="block text-sm font-medium text-gray-700">
                  Recargo por pago extemporáneo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <input
                    type="text"
                    id="lateFee"
                    value={formData.lateFee}
                    onChange={handleChange}
                    className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Monto adicional que se cobrará si no se paga antes de la fecha de vencimiento
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Información importante</p>
                  <p>
                    Si la multa no es pagada antes de la fecha de vencimiento, el recargo por pago extemporáneo se
                    añadirá automáticamente al monto total.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => router.push("/admin/multas")}
                  className="text-white"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#3b6dc7] hover:bg-[#2d5db3] text-white" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Guardando..." : "Guardar Multa"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
