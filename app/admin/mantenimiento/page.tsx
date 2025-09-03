"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Save,
  DollarSign,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  CreditCard,
  Building,
  User,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import { type MaintenancePriceHistory, type BankingDetails } from "@/lib/types"
import AuthGuard from "@/components/auth-guard"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function MantenimientoPage() {
  const { user } = useAuthStore()

  // Estados para cuotas de mantenimiento por condominio
  const [cuotas, setCuotas] = useState<any[]>([])
  const [selectedCuotaId, setSelectedCuotaId] = useState<string>("")
  const [maintenancePrice, setMaintenancePrice] = useState<number>(0)
  const [maintenanceDueDay, setMaintenanceDueDay] = useState<number>(10)
  const [maintenanceLatePaymentFee, setMaintenanceLatePaymentFee] = useState<number>(0)
  const [bankingDetails, setBankingDetails] = useState<BankingDetails | null>(null)

  const [newPrice, setNewPrice] = useState<string>("")
  const [newDueDay, setNewDueDay] = useState<string>("")
  const [newLateFee, setNewLateFee] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<"price" | "dueDate" | "lateFee" | "bankDetails">("price")

  // Nueva función para obtener cuotas de mantenimiento
  const fetchCuotas = async () => {
    try {
      const res = await fetch("/api/cuotas-mantenimiento")
      const data = await res.json()
      if (res.ok && data.success) {
        setCuotas(data.cuotas)
        // Seleccionar la primera cuota por defecto si existe
        if (data.cuotas.length > 0 && !selectedCuotaId) {
          setSelectedCuotaId(String(data.cuotas[0].id))
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Función para refrescar los datos de mantenimiento (dummy, puedes personalizar)
  const fetchSettings = async () => {
    await fetchCuotas()
    // Si necesitas refrescar datos de /api/maintenance, pásale el condominio actual:
    // const condoId = cuotas.find(c => String(c.id) === selectedCuotaId)?.condominio_id || user?.condominiumId
    // await fetch(`/api/maintenance${condoId ? `?condominioId=${condoId}` : ''}`)
  }

  // Cargar datos iniciales desde la API
  useEffect(() => {
    fetchCuotas()
  }, [])
  // Actualizar los campos al cambiar el condominio seleccionado
  useEffect(() => {
    if (!selectedCuotaId) return
    const cuota = cuotas.find((c) => String(c.id) === selectedCuotaId)
    if (cuota) {
      setMaintenancePrice(Number(cuota.monto))
      setNewPrice(String(cuota.monto))
      setMaintenanceDueDay(Number(cuota.dias_gracia))
      setNewDueDay(String(cuota.dias_gracia))
      setMaintenanceLatePaymentFee(Number(cuota.recargo_porcentaje))
      setNewLateFee(String(cuota.recargo_porcentaje))
    }
  }, [selectedCuotaId, cuotas])

  // Estado para los datos bancarios
  const [bankData, setBankData] = useState<
    Omit<BankingDetails, "updatedAt" | "updatedBy" | "reference" | "accountNumber">
  >({
    bankName: bankingDetails?.bankName || "",
    accountHolder: bankingDetails?.accountHolder || "",
    clabe: bankingDetails?.clabe || "",
  })

  // Cargar datos bancarios existentes
  useEffect(() => {
    if (bankingDetails) {
      setBankData({
        bankName: bankingDetails.bankName,
        accountHolder: bankingDetails.accountHolder,
        clabe: bankingDetails.clabe,
      })
    }
  }, [bankingDetails])

  // Nuevo submit para actualizar cuota de mantenimiento
  const handleCuotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const priceValue = Number(newPrice)
    const dueDayValue = Number(newDueDay)
    const lateFeeValue = Number(newLateFee)
    if (isNaN(priceValue) || priceValue <= 0) {
      setError("Por favor ingrese un precio válido")
      setIsSubmitting(false)
      return
    }
    if (isNaN(dueDayValue) || dueDayValue < 1 || dueDayValue > 28) {
      setError("Por favor ingrese un día válido (entre 1 y 28)")
      setIsSubmitting(false)
      return
    }
    if (isNaN(lateFeeValue) || lateFeeValue < 0) {
      setError("Por favor ingrese un recargo válido")
      setIsSubmitting(false)
      return
    }

    try {
      if (user && selectedCuotaId) {
        const cuota = cuotas.find((c) => String(c.id) === selectedCuotaId)
        const res = await fetch("/api/cuotas-mantenimiento", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: cuota.id,
            condominio_id: cuota.condominio_id,
            monto: priceValue,
            recargo_porcentaje: lateFeeValue,
            dias_gracia: dueDayValue
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          await fetchCuotas()
          setSuccess("Cuota de mantenimiento actualizada correctamente")
        } else {
          setError(data.message || "Error al actualizar")
        }
      } else {
        setError("No se pudo identificar al usuario o cuota")
      }
    } catch (err) {
      setError("Ocurrió un error al actualizar la cuota")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDueDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    // Validar que el día sea un número válido entre 1 y 28
    const dueDayValue = Number(newDueDay)
    if (isNaN(dueDayValue) || dueDayValue < 1 || dueDayValue > 28) {
      setError("Por favor ingrese un día válido (entre 1 y 28)")
      setIsSubmitting(false)
      return
    }

    try {
      if (user) {
        const condoId = user?.condominiumId || cuotas.find((c) => String(c.id) === selectedCuotaId)?.condominio_id
        const res = await fetch(`/api/maintenance`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueDay: dueDayValue, updatedBy: user.id, notes, condominioId: condoId }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          await fetchSettings()
          setSuccess("Fecha límite de pago actualizada correctamente")
          setNotes("")
        } else {
          setError(data.message || "Error al actualizar")
        }
      } else {
        setError("No se pudo identificar al usuario")
      }
    } catch (err) {
      setError("Ocurrió un error al actualizar la fecha límite")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLateFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    // Validar que el recargo sea un número válido
    const lateFeeValue = Number(newLateFee)
    if (isNaN(lateFeeValue) || lateFeeValue < 0) {
      setError("Por favor ingrese un recargo válido")
      setIsSubmitting(false)
      return
    }

    try {
      if (user) {
        const res = await fetch("/api/maintenance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lateFee: lateFeeValue, updatedBy: user.id, notes }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          await fetchSettings()
          setSuccess("Recargo por pago tardío actualizado correctamente")
          setNotes("")
        } else {
          setError(data.message || "Error al actualizar")
        }
      } else {
        setError("No se pudo identificar al usuario")
      }
    } catch (err) {
      setError("Ocurrió un error al actualizar el recargo")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Manejar cambios en los campos de datos bancarios
  const handleBankDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setBankData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  // Manejar envío del formulario de datos bancarios
  const handleBankDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      // Validar campos obligatorios
      if (!bankData.bankName.trim()) {
        throw new Error("El nombre del banco es obligatorio")
      }
      if (!bankData.accountHolder.trim()) {
        throw new Error("El nombre del titular es obligatorio")
      }
      if (!bankData.clabe.trim()) {
        throw new Error("La CLABE interbancaria es obligatoria")
      }

      // Actualizar datos bancarios
      if (user) {
        const res = await fetch("/api/maintenance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankName: bankData.bankName,
            accountHolder: bankData.accountHolder,
            clabe: bankData.clabe,
            updatedBy: user.id,
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          await fetchSettings()
          setSuccess("Datos bancarios actualizados correctamente")
        } else {
          setError(data.message || "Error al actualizar")
        }
      } else {
        setError("No se pudo identificar al usuario")
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Ocurrió un error al actualizar los datos bancarios")
      }
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para obtener el nombre del usuario que realizó el cambio
  const getUserName = (userId: string): string => {
    if (userId === user?.id) return "Tú"
    return "Administrador"
  }

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <section className="container mx-auto flex-1 flex flex-col items-start justify-start py-6 px-4">
          <div className="w-full mb-8">
            <h1 className="text-3xl font-bold text-white">Cuota de Mantenimiento</h1>
            <p className="text-gray-300 mt-2">Gestiona el precio mensual de mantenimiento del residencial.</p>
          </div>

          {/* Tarjetas de información */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto mb-8">
            {/* Tarjeta de precio actual */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Precio Actual</h2>
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-[#f9f1dc] rounded-full mb-4">
                    <DollarSign className="h-8 w-8 text-[#d6b15e]" />
                  </div>
                  <div className="text-3xl font-bold text-gray-800">${maintenancePrice.toLocaleString()}</div>
                  <p className="text-gray-500 mt-2">por mes</p>
                </div>
              </div>
            </div>

            {/* Tarjeta de fecha límite */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Fecha Límite</h2>
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-[#f9f1dc] rounded-full mb-4">
                    <Calendar className="h-8 w-8 text-[#d6b15e]" />
                  </div>
                  <div className="text-3xl font-bold text-gray-800">Día {maintenanceDueDay}</div>
                  <p className="text-gray-500 mt-2">de cada mes</p>
                </div>
              </div>
            </div>

            {/* Tarjeta de recargo */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recargo por Pago Tardío</h2>
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto bg-[#f9f1dc] rounded-full mb-4">
                    <Clock className="h-8 w-8 text-[#d6b15e]" />
                  </div>
                  <div className="text-3xl font-bold text-gray-800">${maintenanceLatePaymentFee.toLocaleString()}</div>
                  <p className="text-gray-500 mt-2">por pago tardío</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pestañas para editar diferentes aspectos */}
          <div className="w-full bg-white rounded-lg shadow-md overflow-hidden max-w-6xl mx-auto">
            <div className="flex flex-wrap border-b">
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "price" ? "bg-[#f9f1dc] text-[#d6b15e] border-b-2 border-[#d6b15e]" : "text-gray-600"
                }`}
                onClick={() => setActiveTab("price")}
              >
                Precio
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "dueDate" ? "bg-[#f9f1dc] text-[#d6b15e] border-b-2 border-[#d6b15e]" : "text-gray-600"
                }`}
                onClick={() => setActiveTab("dueDate")}
              >
                Fecha Límite
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "lateFee" ? "bg-[#f9f1dc] text-[#d6b15e] border-b-2 border-[#d6b15e]" : "text-gray-600"
                }`}
                onClick={() => setActiveTab("lateFee")}
              >
                Recargo
              </button>
              <button
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "bankDetails"
                    ? "bg-[#f9f1dc] text-[#d6b15e] border-b-2 border-[#d6b15e]"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("bankDetails")}
              >
                Datos Bancarios
              </button>
            </div>

            <div className="p-6">
              {success && (
                <div
                  className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6"
                  role="alert"
                >
                  <span className="block sm:inline">{success}</span>
                </div>
              )}

              {error && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
                  role="alert"
                >
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              {/* Formulario para seleccionar condominio y editar cuota */}
              {activeTab === "price" && (
                <form onSubmit={handleCuotaSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="condominio-price" className="block text-sm font-medium text-gray-700">
                      Selecciona el condominio
                    </label>
                    <select
                      id="condominio-price"
                      value={selectedCuotaId}
                      onChange={(e) => setSelectedCuotaId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                      required
                    >
                      {cuotas.map((cuota) => (
                        <option key={cuota.id} value={cuota.id}>
                          Condominio #{cuota.condominio_id} - {cuota.tipo_propiedad}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Nuevo precio de mantenimiento
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="text"
                        id="price"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="dueDay" className="block text-sm font-medium text-gray-700">
                      Día límite de pago (1-28)
                    </label>
                    <input
                      type="number"
                      id="dueDay"
                      value={newDueDay}
                      onChange={(e) => setNewDueDay(e.target.value)}
                      min="1"
                      max="28"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                      placeholder="Día del mes"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lateFee" className="block text-sm font-medium text-gray-700">
                      Recargo por pago tardío (%)
                    </label>
                    <input
                      type="text"
                      id="lateFee"
                      value={newLateFee}
                      onChange={(e) => setNewLateFee(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <div className="text-sm text-yellow-700">
                        <p className="font-medium mb-1">Importante</p>
                        <p>
                          Al actualizar la cuota, se notificará automáticamente a todos los residentes sobre el cambio.
                          Este cambio se aplicará a partir del próximo ciclo de facturación.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white"
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Guardando..." : "Actualizar Cuota"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Formulario para actualizar fecha límite */}
              {activeTab === "dueDate" && (
                <form onSubmit={handleDueDaySubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="condominio-due" className="block text-sm font-medium text-gray-700">
                      Selecciona el condominio
                    </label>
                    <select
                      id="condominio-due"
                      value={selectedCuotaId}
                      onChange={(e) => setSelectedCuotaId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                      required
                    >
                      {cuotas.map((cuota) => (
                        <option key={cuota.id} value={cuota.id}>
                          Condominio #{cuota.condominio_id} - {cuota.tipo_propiedad}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="dueDay" className="block text-sm font-medium text-gray-700">
                      Día límite de pago (1-28)
                    </label>
                    <input
                      type="number"
                      id="dueDay"
                      value={newDueDay}
                      onChange={(e) => setNewDueDay(e.target.value)}
                      min="1"
                      max="28"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                      placeholder="Día del mes"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Seleccione un día entre 1 y 28 para evitar problemas con meses cortos.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notas (opcional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                      placeholder="Razón del cambio de fecha límite, detalles adicionales, etc."
                    ></textarea>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <div className="text-sm text-yellow-700">
                        <p className="font-medium mb-1">Importante</p>
                        <p>
                          Al actualizar la fecha límite, se notificará automáticamente a todos los residentes sobre el
                          cambio. Este cambio se aplicará a partir del próximo ciclo de facturación.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white"
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Guardando..." : "Actualizar Fecha Límite"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Formulario para actualizar recargo */}
              {activeTab === "lateFee" && (
                <form onSubmit={handleLateFeeSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="condominio-late" className="block text-sm font-medium text-gray-700">
                      Selecciona el condominio
                    </label>
                    <select
                      id="condominio-late"
                      value={selectedCuotaId}
                      onChange={(e) => setSelectedCuotaId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                      required
                    >
                      {cuotas.map((cuota) => (
                        <option key={cuota.id} value={cuota.id}>
                          Condominio #{cuota.condominio_id} - {cuota.tipo_propiedad}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="lateFee" className="block text-sm font-medium text-gray-700">
                      Recargo por pago tardío
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                      <input
                        type="text"
                        id="lateFee"
                        value={newLateFee}
                        onChange={(e) => setNewLateFee(e.target.value)}
                        className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Este monto se cobrará adicionalmente si el pago se realiza después de la fecha límite.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notas (opcional)
                    </label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                      placeholder="Razón del cambio de recargo, detalles adicionales, etc."
                    ></textarea>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                      <div className="text-sm text-yellow-700">
                        <p className="font-medium mb-1">Importante</p>
                        <p>
                          Al actualizar el recargo, se notificará automáticamente a todos los residentes sobre el
                          cambio. Este cambio se aplicará a partir del próximo ciclo de facturación.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white"
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Guardando..." : "Actualizar Recargo"}
                    </Button>
                  </div>
                </form>
              )}

              {/* Formulario para actualizar datos bancarios */}
              {activeTab === "bankDetails" && (
                <form onSubmit={handleBankDetailsSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="condominio-bank" className="block text-sm font-medium text-gray-700">
                      Selecciona el condominio
                    </label>
                    <select
                      id="condominio-bank"
                      value={selectedCuotaId}
                      onChange={(e) => setSelectedCuotaId(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                      required
                    >
                      {cuotas.map((cuota) => (
                        <option key={cuota.id} value={cuota.id}>
                          Condominio #{cuota.condominio_id} - {cuota.tipo_propiedad}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                      Nombre del banco
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        id="bankName"
                        value={bankData.bankName}
                        onChange={handleBankDataChange}
                        className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                        placeholder="Ej: BBVA, Santander, Banorte"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700">
                      Nombre del titular
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        id="accountHolder"
                        value={bankData.accountHolder}
                        onChange={handleBankDataChange}
                        className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                        placeholder="Nombre completo del titular de la cuenta"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="clabe" className="block text-sm font-medium text-gray-700">
                      CLABE Interbancaria
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        id="clabe"
                        value={bankData.clabe}
                        onChange={handleBankDataChange}
                        className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                        placeholder="18 dígitos"
                        required
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Información importante</p>
                        <p>
                          Estos datos bancarios serán visibles para todos los residentes en la sección de pagos. Las
                          referencias de pago se generan automáticamente para cada usuario.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white"
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Guardando..." : "Guardar Datos Bancarios"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Historial de cambios de precio eliminado por no ser necesario */}
        </section>
      </main>
    </AuthGuard>
  )
}
