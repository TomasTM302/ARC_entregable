"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { X, Save, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface NewPaymentAgreementModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

interface Payment {
  id: string
  description: string
  amount: string
  paymentDate: string
  expanded: boolean
}

interface PendingPayment {
  id: string
  amount: number
  month: number
  year: number
}

export default function NewPaymentAgreementModal({ isOpen, onClose, onCreated }: NewPaymentAgreementModalProps) {
  // Estado y hooks deben ir antes de cualquier useEffect que los use
  const [selectedUser, setSelectedUser] = useState("")
  const [numberOfPayments, setNumberOfPayments] = useState(1)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [totalAmount, setTotalAmount] = useState(0)
  // Cotización: precio base de mantenimiento y recargo por retraso (%)
  const [maintenancePrice, setMaintenancePrice] = useState<number>(0)
  const [lateFeePercent, setLateFeePercent] = useState<number>(0)
  const [dueDay, setDueDay] = useState<number | null>(null)

  // Mensualidades pendientes del residente
  const [pendingList, setPendingList] = useState<PendingPayment[]>([])
  const [selectedPendingCount, setSelectedPendingCount] = useState<number>(0)
  const [paidList, setPaidList] = useState<PendingPayment[]>([])

  // Resumen: esperadas vs pagadas
  const [expectedMonths, setExpectedMonths] = useState<number>(0)
  const [paidMonths, setPaidMonths] = useState<number>(0)

  // Suscripción correcta al store de usuarios
  const users = useAuthStore((s) => s.users)
  const fetchUsers = useAuthStore((s) => s.fetchUsers)
  const { toast } = useToast()

  // Cargar precio de mantenimiento para estimar faltantes en BD
  useEffect(() => {
    let aborted = false
    async function loadPrice() {
      try {
        const res = await fetch("/api/maintenance")
        const data = await res.json()
        if (!aborted && res.ok && data?.success && data?.settings?.price) {
          setMaintenancePrice(Number(data.settings.price) || 0)
        }
      } catch {}
    }
    loadPrice()
    return () => { aborted = true }
  }, [])

  // Cargar mensualidades adeudadas del usuario seleccionado y calcular resumen
  useEffect(() => {
    async function fetchPendingPayments() {
      if (!selectedUser) {
        setPendingList([])
        setSelectedPendingCount(0)
        setExpectedMonths(0)
        setPaidMonths(0)
        return;
      }
      try {
        // Llama a la API de pagos para obtener mensualidades pendientes
        const res = await fetch(`/api/pagos?userId=${selectedUser}&status=pendiente`)
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.pagos)) {
          // Mapear pagos pendientes normalizados
          const list: PendingPayment[] = data.pagos.map((p: any) => ({
            id: String(p.id),
            amount: Number(p.amount ?? 0),
            month: Number(p.month ?? 0),
            year: Number(p.year ?? 0),
          }))
          // Ordenar por antigüedad (más antiguos primero)
          list.sort((a, b) => a.year - b.year || a.month - b.month)
          setPendingList(list)
          setSelectedPendingCount(list.length)
        } else {
          setPendingList([])
          setSelectedPendingCount(0)
        }

        // Calcular mensualidades esperadas desde createdAt hasta el mes actual (inclusive)
        const user = users.find((u) => String(u.id) === String(selectedUser))
        let expected = 0
        if (user?.createdAt) {
          const start = new Date(user.createdAt)
          const now = new Date()
          if (!isNaN(start.getTime())) {
            const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1
            expected = Math.max(0, months)
          }
        }
        setExpectedMonths(expected)

        // Contar mensualidades pagadas
        try {
          const resPaid = await fetch(`/api/pagos?userId=${selectedUser}&status=completed`)
          const dataPaid = await resPaid.json()
          if (resPaid.ok && dataPaid.success && Array.isArray(dataPaid.pagos)) {
            setPaidMonths(dataPaid.pagos.length)
            const list: PendingPayment[] = dataPaid.pagos.map((p: any) => ({
              id: String(p.id ?? `paid-${p.year}-${p.month}`),
              amount: Number(p.amount ?? 0),
              month: Number(p.month ?? 0),
              year: Number(p.year ?? 0),
            }))
            list.sort((a, b) => a.year - b.year || a.month - b.month)
            setPaidList(list)
          } else {
            setPaidMonths(0)
            setPaidList([])
          }
        } catch {
          setPaidMonths(0)
          setPaidList([])
        }
      } catch {
        setPendingList([])
        setSelectedPendingCount(0)
        setExpectedMonths(0)
        setPaidMonths(0)
      }
    }
    fetchPendingPayments();
  }, [selectedUser, users])

  // Cargar usuarios al abrir el modal
  useEffect(() => {
    if (isOpen) fetchUsers();
  }, [isOpen]);

  // Cargar el día de pago vigente del condominio del usuario seleccionado
  useEffect(() => {
    let aborted = false
    async function loadDueDay() {
      if (!selectedUser) { setDueDay(null); return }
      try {
        const res = await fetch(`/api/cuotas/vigente?userId=${selectedUser}`)
        const data = await res.json()
        if (!aborted && res.ok && data?.success) {
          setDueDay(data.dia_pago ?? null)
        }
      } catch {
        setDueDay(null)
      }
    }
    loadDueDay()
    return () => { aborted = true }
  }, [selectedUser])

  // Periodos faltantes en BD desde alta hasta hoy (no pagados ni pendientes)
  const missingPeriods = useMemo(() => {
    const result: Array<{ month: number; year: number }> = []
    const user = users.find((u) => String(u.id) === String(selectedUser))
    if (!user?.createdAt) return result
    const start = new Date(user.createdAt)
    if (isNaN(start.getTime())) return result
    const now = new Date()
    const monthsTotal = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1
    const key = (y: number, m: number) => `${y}-${m}`
    const pendingSet = new Set(pendingList.map((p) => key(p.year, p.month)))
    const paidSet = new Set(paidList.map((p) => key(p.year, p.month)))
    for (let i = 0; i < monthsTotal; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const k = key(y, m)
      if (!pendingSet.has(k) && !paidSet.has(k)) result.push({ year: y, month: m })
    }
    return result
  }, [users, selectedUser, pendingList, paidList])

  // Suma base seleccionada considerando también los faltantes (al precio de mantenimiento)
  const selectedBaseSum = useMemo(() => {
    if (selectedPendingCount <= 0) return 0
    const takeFromPending = Math.min(selectedPendingCount, pendingList.length)
    const fromPending = pendingList.slice(0, takeFromPending).reduce((s, p) => s + (p.amount || 0), 0)
    const needMissing = Math.max(0, selectedPendingCount - takeFromPending)
    const fromMissing = needMissing * (Number(maintenancePrice) || 0)
    return Math.round((fromPending + fromMissing) * 100) / 100
  }, [selectedPendingCount, pendingList, maintenancePrice])

  // Recargo por retraso aplicado sobre lo seleccionado (cotización)
  const surchargeAmount = useMemo(() => {
    const pct = Number(lateFeePercent) || 0
    const raw = (selectedBaseSum * pct) / 100
    return Math.round(raw * 100) / 100
  }, [selectedBaseSum, lateFeePercent])

  const quotedSelectedTotal = useMemo(() => {
    return Math.round((selectedBaseSum + surchargeAmount) * 100) / 100
  }, [selectedBaseSum, surchargeAmount])

  const missingInDb = useMemo(() => {
    return Math.max(0, expectedMonths - paidMonths - pendingList.length)
  }, [expectedMonths, paidMonths, pendingList.length])

  // Inicializar pagos y dividir el total seleccionado entre el número de pagos, asignando fechas mensuales consecutivas
  useEffect(() => {
    if (!selectedUser || quotedSelectedTotal <= 0 || numberOfPayments <= 0) {
      setPayments([])
      return
    }
    const cuota = Math.round((quotedSelectedTotal / numberOfPayments) * 100) / 100
    const newPayments: Payment[] = []
  // Base: usar la fecha ya seleccionada del primer pago o el siguiente mes (ajustado al día vigente de cuota)
  const baseStart = payments[0]?.paymentDate ? new Date(payments[0].paymentDate) : nextMonthBase()
    for (let i = 1; i <= numberOfPayments; i++) {
      const d = addMonths(baseStart, i - 1)
      newPayments.push({
        id: `payment-${Date.now()}-${i}`,
        description: `Cuota ${i} de ${numberOfPayments}`,
        amount: cuota.toString(),
        paymentDate: formatDate(d),
        expanded: false,
      })
    }
    setPayments(newPayments)
  }, [selectedUser, quotedSelectedTotal, numberOfPayments, dueDay])

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

  // Utilidades de fecha para cuotas mensuales
  const formatDate = (d: Date) => d.toISOString().slice(0, 10)
  const addMonths = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth() + m, d.getDate())
  const nextMonthSameDay = () => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
  }

  const nextMonthBase = () => {
    const now = new Date()
    const base = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    if (dueDay && dueDay > 0 && dueDay <= 28) return new Date(base.getFullYear(), base.getMonth(), dueDay)
    return base
  }

  const toggleExpand = (id: string) => {
    setPayments(payments.map((payment) => (payment.id === id ? { ...payment, expanded: !payment.expanded } : payment)))
  }

  const updatePayment = (id: string, field: keyof Payment, value: string) => {
    if (field === "paymentDate" && payments.length > 0 && id === payments[0].id) {
      const start = value ? new Date(value) : null
      if (start && !isNaN(start.getTime())) {
        setPayments((prev) => prev.map((p, idx) => (
          idx === 0 ? { ...p, paymentDate: value } : { ...p, paymentDate: formatDate(addMonths(start, idx)) }
        )))
        return
      }
    }
    setPayments(payments.map((payment) => (payment.id === id ? { ...payment, [field]: value } : payment)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!selectedUser) {
      setError("Por favor seleccione un usuario");
      setIsSubmitting(false);
      return;
    }

    if (payments.length === 0) {
      setError("No hay parcialidades generadas. Verifique la selección de mensualidades y el número de pagos.")
      setIsSubmitting(false)
      return
    }
    const incompletePayments = payments.filter((p) => !p.description || !p.amount || !p.paymentDate);
    if (incompletePayments.length > 0) {
      setError(`Por favor complete todos los campos en los pagos ${incompletePayments.map((_, i) => i + 1).join(", ")}`);
      setIsSubmitting(false);
      return;
    }

  if (quotedSelectedTotal <= 0 || selectedPendingCount <= 0) {
      setError("Debe seleccionar al menos una mensualidad adeudada")
      setIsSubmitting(false)
      return
    }

    try {
      // Crear convenio de forma transaccional (cancela/crea mensualidades y genera cuotas)
      const cuotas = payments.map((p, idx) => ({
        numero_pago: idx + 1,
        monto: Number.parseFloat(p.amount || "0") || 0,
        fecha_vencimiento: p.paymentDate,
      }))
      const fechaInicioCuotas = payments[0]?.paymentDate || new Date().toISOString().slice(0, 10)
      const res = await fetch("/api/convenios/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario_id: selectedUser,
          meses_incluir: selectedPendingCount,
          num_pagos: numberOfPayments,
          fecha_inicio_cuotas: fechaInicioCuotas,
          recargo_percent: lateFeePercent,
          cuotas,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "No se pudo crear el convenio")

      // Toast con resumen
      const resumen = data?.resumen
      toast({
        title: "Convenio creado",
        description:
          resumen
            ? `Total: $${(resumen.total ?? 0).toLocaleString()} | Base: $${(resumen.base ?? 0).toLocaleString()} | Recargo: $${(resumen.recargo ?? 0).toLocaleString()} | Cancelados: ${resumen.cancelados_existentes ?? 0} | Creados: ${resumen.creados_cancelado ?? 0}`
            : "Se generó el convenio y sus cuotas",
      })

      setSuccess("Convenio creado exitosamente")
      setIsSubmitting(false);
      try { onCreated?.(); } catch {}
      setTimeout(() => {
        onClose();
        setSelectedUser("");
  setNumberOfPayments(1);
        setPayments([createEmptyPayment(1)]);
  setPendingList([])
  setSelectedPendingCount(0)
  setLateFeePercent(0)
  setPaidList([])
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Error al crear convenio");
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl text-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Nuevo Convenio de Pago</h2>
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

            {/* Número de parcialidades del convenio */}
            <div className="space-y-2">
              <label htmlFor="num-payments" className="block text-sm font-medium text-gray-700">
                Número de parcialidades
              </label>
              <input
                id="num-payments"
                type="number"
                min={1}
                max={24}
                value={numberOfPayments}
                onChange={(e) => setNumberOfPayments(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              />
            </div>
          </div>

          {/* Mensualidades adeudadas y cotización */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="text-sm text-gray-600">Mensualidades adeudadas</div>
                <div className="text-lg font-semibold text-gray-800">{pendingList.length}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Esperadas desde alta</div>
                <div className="text-lg font-semibold text-gray-800">{expectedMonths}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Pagadas</div>
                <div className="text-lg font-semibold text-gray-800">{paidMonths}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Faltantes en BD</div>
                <div className="text-lg font-semibold text-gray-800">{missingInDb}</div>
              </div>
              <div className="flex-1">
                <label htmlFor="count-select" className="block text-sm font-medium text-gray-700">
                  Cantidad a incluir en convenio (se cancelarán en BD)
                </label>
                <input
                  id="count-select"
                  type="number"
                  min={0}
                  max={(pendingList.length + missingInDb) || 0}
                  value={selectedPendingCount}
                  onChange={(e) => setSelectedPendingCount(Math.max(0, Math.min(pendingList.length + missingInDb, Number(e.target.value) || 0)))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  disabled={!selectedUser || (pendingList.length + missingInDb) === 0}
                />
              </div>
              <div>
                <div className="text-sm text-gray-600">Suma seleccionada</div>
                <div className="text-lg font-semibold text-[#3b6dc7]">${selectedBaseSum.toLocaleString()}</div>
              </div>
            </div>
            {selectedUser && pendingList.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">Se tomarán las mensualidades más antiguas primero.</p>
            )}

            {/* Totales de cotización */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-white border rounded-md">
                <div className="text-xs text-gray-500">Total adeudado (detectado)</div>
                <div className="text-base font-semibold text-gray-800">${pendingList.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-white border rounded-md">
                <div className="text-xs text-gray-500">Faltantes en BD (estimado)</div>
                <div className="text-base font-semibold text-gray-800">${(missingInDb * maintenancePrice).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-white border rounded-md">
                <label htmlFor="late-fee" className="block text-xs text-gray-600 mb-1">Cuota extra por retraso (%)</label>
                <input
                  id="late-fee"
                  type="number"
                  min={0}
                  max={100}
                  value={lateFeePercent}
                  onChange={(e) => setLateFeePercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
                  placeholder="0"
                />
                <div className="mt-1 text-xs text-gray-600">Recargo estimado: ${surchargeAmount.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-white border rounded-md">
                <div className="text-xs text-gray-500">Total cotizado (seleccionado)</div>
                <div className="text-base font-bold text-[#3b6dc7]">${quotedSelectedTotal.toLocaleString()}</div>
              </div>
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
                        {payment.amount && ` - ${payment.amount}`}
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
                          <label htmlFor={`amount-${payment.id}`} className="block text-sm font-medium text-gray-700">
                            Monto
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
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

          {/* Total acumulado (con recargo en cotización) */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Total del convenio:</h3>
              <span className="text-xl font-bold text-[#3b6dc7]">${quotedSelectedTotal.toLocaleString()}</span>
            </div>
            {lateFeePercent > 0 && (
              <div className="mt-1 text-xs text-gray-600 text-right">
                Base: ${selectedBaseSum.toLocaleString()} + Recargo ({lateFeePercent}%): ${surchargeAmount.toLocaleString()}
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Información importante</p>
              <p>
                Al crear este convenio, se generará un plan de pagos que el residente deberá cumplir según las fechas
                establecidas. El sistema registrará automáticamente los pagos realizados y los pendientes.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={onClose}
              className="text-white font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#3b6dc7] hover:bg-[#2d5db3] text-white" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Guardando..." : "Crear Convenio"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
