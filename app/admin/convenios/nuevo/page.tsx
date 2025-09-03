"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import AuthGuard from "@/components/auth-guard"
import { useRouter } from "next/navigation"

interface Payment {
  id: string
  description: string
  amount: string
  paymentDate: string
  expanded: boolean
}

export default function NuevoConvenioPage() {
  const router = useRouter()
  const { getUsers, fetchUsers } = useAuthStore()
  const users = getUsers()
  useEffect(() => {
    console.log('[LOG usuarios]', users)
  }, [users])

  // Cargar usuarios al montar la página
  useEffect(() => {
    fetchUsers()
  }, [])

  const [selectedUser, setSelectedUser] = useState("")
  const [numberOfPayments, setNumberOfPayments] = useState(1)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [totalAmount, setTotalAmount] = useState(0)

  // Initialize with one payment
  useEffect(() => {
    if (payments.length === 0) {
      setPayments([createEmptyPayment(1)])
    }
  }, [])

  // Update payments when numberOfPayments changes
  useEffect(() => {
    // No actualizar los pagos si el campo está temporalmente vacío
    if (numberOfPayments === 0) return

    const newPayments = [...payments]

    // Add new payments if needed
    if (numberOfPayments > payments.length) {
      for (let i = payments.length + 1; i <= numberOfPayments; i++) {
        newPayments.push(createEmptyPayment(i))
      }
    }
    // Remove excess payments if needed
    else if (numberOfPayments < payments.length) {
      newPayments.splice(numberOfPayments)
    }

    setPayments(newPayments)
  }, [numberOfPayments])

  // Calculate total amount whenever payments change
  useEffect(() => {
    const total = payments.reduce((sum, payment) => {
      const amount = Number.parseFloat(payment.amount) || 0
      return sum + amount
    }, 0)
    setTotalAmount(total)
  }, [payments])

  function createEmptyPayment(index: number): Payment {
    return {
      id: `payment-${Date.now()}-${index}`,
      description: "",
      amount: "",
      paymentDate: "",
      expanded: false,
    }
  }

  const toggleExpand = (id: string) => {
    setPayments(payments.map((payment) => (payment.id === id ? { ...payment, expanded: !payment.expanded } : payment)))
  }

  const updatePayment = (id: string, field: keyof Payment, value: string) => {
    setPayments(payments.map((payment) => (payment.id === id ? { ...payment, [field]: value } : payment)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate form
    if (!selectedUser) {
      alert("Por favor seleccione un usuario")
      setIsSubmitting(false)
      return
    }

    // Check if all payments have required fields
    const incompletePayments = payments.filter((p) => !p.description || !p.amount || !p.paymentDate)

    if (incompletePayments.length > 0) {
      alert(`Por favor complete todos los campos en los pagos ${incompletePayments.map((_, i) => i + 1).join(", ")}`)
      setIsSubmitting(false)
      return
    }

    // In a real app, you would save the data to your backend here
    console.log("Convenio creado:", {
      userId: selectedUser,
      numberOfPayments,
      totalAmount,
      payments: payments.map(({ id, expanded, ...rest }) => rest), // Remove unnecessary fields
    })

    // Show success message
    setSuccess("Convenio creado exitosamente")

    // Redirect to convenios list after 2 seconds
    setTimeout(() => {
      router.push("/admin/convenios")
    }, 2000)
  }

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <section className="container mx-auto flex-1 flex flex-col items-start justify-start py-6 px-4">
          <div className="w-full mb-8">
            <h1 className="text-3xl font-bold text-white">Crear Convenio de Pago</h1>
            <p className="text-gray-300 mt-2">Establece acuerdos de pago en parcialidades para los residentes.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md w-full max-w-4xl mx-auto">
            {success && (
              <div
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
                role="alert"
              >
                <span className="block sm:inline">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Selección de usuario */}
                <div className="space-y-2">
                  <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                    Seleccionar Residente
                  </label>
                  <select
                    id="user"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                    required
                  >
                    <option value="">Seleccionar usuario</option>
                    {users
                      .filter((user) => user.role === "resident")
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} - {user.house}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Número de pagos */}
                <div className="space-y-2">
                  <label htmlFor="numberOfPayments" className="block text-sm font-medium text-gray-700">
                    Número de Pagos
                  </label>
                  <input
                    type="number"
                    id="numberOfPayments"
                    min="1"
                    max="24"
                    value={numberOfPayments}
                    onChange={(e) => {
                      const value = e.target.value
                      // Permitir que el campo esté temporalmente vacío
                      if (value === "") {
                        setNumberOfPayments(0)
                      } else {
                        const numValue = Number.parseInt(value)
                        // Solo actualizar si es un número válido
                        if (!isNaN(numValue)) {
                          setNumberOfPayments(numValue)
                        }
                      }
                    }}
                    onBlur={() => {
                      // Al perder el foco, si el valor es 0 o inválido, establecerlo a 1
                      if (numberOfPayments < 1) {
                        setNumberOfPayments(1)
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                    required
                  />
                </div>
              </div>

              {/* Parcialidades */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Parcialidades</h3>

                <div className="space-y-4">
                  {payments.map((payment, index) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Cabecera de la tarjeta */}
                      <div
                        className={`flex justify-between items-center p-4 cursor-pointer ${
                          payment.expanded ? "bg-gray-50" : "bg-white"
                        }`}
                        onClick={() => toggleExpand(payment.id)}
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-[#3b6dc7] text-white flex items-center justify-center mr-3">
                            {index + 1}
                          </div>
                          <h4 className="font-medium">
                            Pago {index + 1}
                            {payment.amount && ` - $${payment.amount}`}
                            {payment.paymentDate && ` - ${payment.paymentDate}`}
                          </h4>
                        </div>
                        {payment.expanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>

                      {/* Contenido expandible */}
                      {payment.expanded && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label
                                htmlFor={`description-${payment.id}`}
                                className="block text-sm font-medium text-gray-700"
                              >
                                Descripción
                              </label>
                              <input
                                type="text"
                                id={`description-${payment.id}`}
                                value={payment.description}
                                onChange={(e) => updatePayment(payment.id, "description", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                                placeholder="Ej: Pago inicial, Segunda cuota, etc."
                              />
                            </div>

                            <div className="space-y-2">
                              <label
                                htmlFor={`amount-${payment.id}`}
                                className="block text-sm font-medium text-gray-700"
                              >
                                Monto
                              </label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                  $
                                </span>
                                <input
                                  type="text"
                                  id={`amount-${payment.id}`}
                                  value={payment.amount}
                                  onChange={(e) => updatePayment(payment.id, "amount", e.target.value)}
                                  className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label
                                htmlFor={`paymentDate-${payment.id}`}
                                className="block text-sm font-medium text-gray-700"
                              >
                                Fecha de Pago
                              </label>
                              <input
                                type="date"
                                id={`paymentDate-${payment.id}`}
                                value={payment.paymentDate}
                                onChange={(e) => updatePayment(payment.id, "paymentDate", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total acumulado */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">Total del convenio:</h3>
                  <span className="text-xl font-bold text-[#3b6dc7]">${totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => router.push("/admin/convenios")}
                  className="text-white"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#3b6dc7] hover:bg-[#2d5db3] text-white" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Guardando..." : "Guardar Convenio"}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
