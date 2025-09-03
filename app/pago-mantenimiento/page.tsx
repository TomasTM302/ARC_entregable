"use client"
import Link from "next/link"
import type React from "react"

import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Calendar, ArrowLeft, Building, Info, Copy, Check } from "lucide-react"
// Store eliminado; toda la lógica usa API y hooks locales
import { useState, useEffect, useMemo } from "react"
import { useAuthStore } from "@/lib/auth"
import type { BankingDetails } from "@/lib/types"

// Definir la interfaz PaymentBreakdown
interface PaymentBreakdown {
  maintenance?: number
  surcharges?: number
  fines?: { id: string; description: string; amount: number }[]
  agreements?: { id: string; description: string; amount: number }[]
  advancePayments?: { month: number; year: number; amount: number }[]
}

// Pagos de convenio (parcialidades) para la UI
interface AgreementInstallment {
  id: string
  convenioId: string
  number: number
  amount: number
  dueDate: string
  status: string // 'pendiente' | 'pagado'
  description: string
}

export default function PagoMantenimientoPage() {
  const { user } = useAuthStore()

  const [showLatePaymentInfo, setShowLatePaymentInfo] = useState(false)
  const [showBankDetails, setShowBankDetails] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [showTicket, setShowTicket] = useState(false)
  const [showStripe, setShowStripe] = useState(false)
  const [transferLinked, setTransferLinked] = useState<{
    pagoId: string | number | null
    maintenance: { month: number; year: number; amount: number }[]
    fines: { id: string; reason: string; amount: number }[]
    agreements: { id: string; description: string; amount: number }[]
  } | null>(null)

  // Referencia estable para la transacción (misma en ticket y BD)
  const [reference, setReference] = useState<string>("")

  // Descargar ticket de transferencia en PDF y luego redirigir a inicio
  const downloadTransferTicket = async () => {
    try {
      const { default: jsPDF } = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")
      const doc = new jsPDF()
      const fmt = (n: number) => `$${Number(n || 0).toLocaleString()}`

      // Encabezado
      doc.setFontSize(16)
      doc.text("Ticket de transferencia", 14, 18)
      doc.setFontSize(10)
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 24)
      if (reference) doc.text(`Referencia: ${reference}`, 14, 29)
      if (transferLinked?.pagoId != null) doc.text(`ID verificación: ${String(transferLinked.pagoId)}`, 14, 34)

      // Datos bancarios
      let y = 40
      if (bankingDetails) {
        doc.setFont("helvetica", "bold"); doc.text("Datos bancarios", 14, y); doc.setFont("helvetica", "normal"); y += 6
        doc.text(`Banco: ${bankingDetails.bankName}`, 14, y); y += 5
        if (bankingDetails.accountHolder) { doc.text(`Titular: ${bankingDetails.accountHolder}`, 14, y); y += 5 }
        if (bankingDetails.clabe) { doc.text(`CLABE: ${bankingDetails.clabe}`, 14, y); y += 6 }
      }

      // Conceptos vinculados
      if (transferLinked) {
        doc.setFont("helvetica", "bold"); doc.text("Conceptos vinculados", 14, y); doc.setFont("helvetica", "normal"); y += 6
        const lines: string[][] = []
        transferLinked.maintenance.forEach((m) => {
          lines.push([
            "Mantenimiento",
            new Date(m.year, m.month - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
            fmt(m.amount),
          ])
        })
        transferLinked.agreements.forEach((a) => { lines.push(["Convenio", a.description, fmt(a.amount)]) })
        transferLinked.fines.forEach((f) => { lines.push(["Multa", f.reason, fmt(f.amount)]) })
  ;(autoTable as any)(doc as any, { head: [["Tipo", "Descripción", "Monto"]], body: lines, startY: y })
  y = (doc as any).lastAutoTable.finalY + 6
      }

      // Total
  doc.setFont("helvetica", "bold");
      doc.text(`Total a transferir: ${fmt(Number(totalAmount))}`, 14, y); y += 8
  doc.setFont("helvetica", "normal")

      // Leyenda
      doc.setTextColor(200, 0, 0)
      doc.text("Este documento NO es un comprobante válido.", 14, y)
      y += 5
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.text("Conserve este ticket y envíe su comprobante bancario a la administración para la validación.", 14, y)

      // Guardar y redirigir
      doc.save(`ticket-transferencia-${reference}.pdf`)
      setTimeout(() => { window.location.href = "/home" }, 600)
    } catch (e) {
      alert("No se pudo generar el ticket. Intente de nuevo.")
    }
  }

  const StripeCardPayment = useMemo(() => dynamic(() => import("@/components/stripe-card-payment"), { ssr: false }), [])

  // Settings de mantenimiento (desde API)
  const [maintenancePrice, setMaintenancePrice] = useState<number>(0)
  const [maintenanceDueDay, setMaintenanceDueDay] = useState<number>(10)
  const [maintenanceLatePaymentFee, setMaintenanceLatePaymentFee] = useState<number>(0)
  const [bankingDetails, setBankingDetails] = useState<BankingDetails | null>(null)

  useEffect(() => {
    let aborted = false
  async function loadSettings() {
      try {
    const condoId = user?.condominiumId || ""
    const url = condoId ? `/api/maintenance?condominioId=${encodeURIComponent(condoId)}` : "/api/maintenance"
    const res = await fetch(url)
        const data = await res.json()
        if (res.ok && data?.success && !aborted) {
          const s = data.settings || {}
          if (typeof s.price === "number") setMaintenancePrice(s.price)
          if (typeof s.due_day === "number") setMaintenanceDueDay(s.due_day)
          if (typeof s.late_fee === "number") setMaintenanceLatePaymentFee(s.late_fee)
          if (s.bank_name) {
            setBankingDetails({
              bankName: s.bank_name,
              accountHolder: s.account_holder || "",
              clabe: s.clabe || "",
              updatedAt: s.updated_at || undefined,
              updatedBy: s.updated_by || undefined,
            })
          } else {
            setBankingDetails(null)
          }
        }
      } catch (e) {
        console.error("Error cargando /api/maintenance:", e)
      }
    }
    loadSettings()
    return () => {
      aborted = true
    }
  }, [])

  // Modificar el estado para los pagos seleccionados para incluir multas y convenios individuales
  const [selectedPayments, setSelectedPayments] = useState({
    maintenance: true,
    fines: {} as Record<string, boolean>, // Cambio para seleccionar multas individuales
    agreements: {} as Record<string, boolean>, // Cambio para seleccionar convenios individuales
  })

  // Estado para pagos adelantados
  const [advanceMonths, setAdvanceMonths] = useState<number>(0)

  // Multas del usuario desde API
  type UIFine = { id: string; reason: string; amount: number; dueDate: string; status: "pending" | "overdue" | "pagada" | "cancelada"; lateFee: number }
  const [userFines, setUserFines] = useState<UIFine[]>([])

  useEffect(() => {
    let aborted = false
    const loadFines = async () => {
      if (!user) return
      try {
        const res = await fetch(`/api/multas?userId=${encodeURIComponent(user.id)}&estado=pendiente`)
        const data = await res.json()
        if (!res.ok || !data?.success) return
        const rows = Array.isArray(data.multas) ? data.multas : []
        const today = new Date()
        const mapped: UIFine[] = rows.map((m: any) => {
          const due = m.dueDate || m.fecha_vencimiento
          const isOver = due ? new Date(due) < today : false
          return {
            id: String(m.id),
            reason: m.reason ?? m.descripcion ?? "Multa",
            amount: Number(m.amount ?? m.monto ?? 0),
            dueDate: due ?? "",
            status: isOver ? "overdue" : "pending",
            lateFee: 0,
          }
        })
        if (!aborted) setUserFines(mapped)
      } catch (e) {
        console.warn("No se pudieron cargar multas del usuario", e)
      }
    }
    loadFines()
    return () => { aborted = true }
  }, [user])

  // Periodos (YYYY-MM) ya cubiertos (pagados o pendientes por transferencia)
  const [blockedPeriods, setBlockedPeriods] = useState<Set<string>>(new Set())

  useEffect(() => {
    let canceled = false
    const loadCovered = async () => {
      if (!user) return
      try {
        // Obtenemos pagados y pendientes y bloqueamos meses >= actual
        const [rPaid, rPend] = await Promise.all([
          fetch(`/api/pagos?userId=${encodeURIComponent(user.id)}&status=completed`),
          fetch(`/api/pagos?userId=${encodeURIComponent(user.id)}&status=pending`),
        ])
        const [dPaid, dPend] = await Promise.all([rPaid.json(), rPend.json()])
        const now = new Date()
        const set = new Set<string>()
        const addRows = (rows: any[]) => {
          rows.forEach((p) => {
            const m = Number(p.month || p.periodo_mes || 0)
            const y = Number(p.year || p.periodo_anio || 0)
            if (!m || !y) return
            const dt = new Date(y, m - 1, 1)
            if (dt >= new Date(now.getFullYear(), now.getMonth(), 1)) {
              set.add(`${y}-${String(m).padStart(2, "0")}`)
            }
          })
        }
        if (Array.isArray(dPaid?.pagos)) addRows(dPaid.pagos)
        if (Array.isArray(dPend?.pagos)) addRows(dPend.pagos)
        if (!canceled) setBlockedPeriods(set)
      } catch (e) {
        console.warn("No se pudieron cargar periodos cubiertos", e)
      }
    }
    loadCovered()
    return () => { canceled = true }
  }, [user])

  // Calcular meses disponibles para adelantar (hasta 12), excluyendo cubiertos
  const availableAdvanceMonths = useMemo(() => {
    const months: { value: number; label: string; month: number; year: number }[] = []
    for (let i = 1; i <= 12; i++) {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + i)
      const key = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}`
      if (blockedPeriods.has(key)) continue
      months.push({
        value: i,
        label: `${futureDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}`,
        month: futureDate.getMonth() + 1,
        year: futureDate.getFullYear(),
      })
    }
    return months
  }, [blockedPeriods])

  // Convenios/parcialidades del usuario (desde SQL)
  const [userAgreements, setUserAgreements] = useState<AgreementInstallment[]>([])

  // Cargar convenios y sus parcialidades pendientes del usuario
  useEffect(() => {
    let aborted = false
    async function loadAgreements() {
      if (!user) return
      try {
        const res = await fetch("/api/convenios")
        const data = await res.json()
        console.log("[LOG convenios]", data.convenios);
        if (!res.ok || !data?.success) return

        const convenios = (data.convenios || []).filter((c: any) => String(c.userId) === String(user.id))

        // Cargar pagos de cada convenio y quedarnos con los pendientes
        const all: AgreementInstallment[] = []
        for (const c of convenios) {
          const pr = await fetch(`/api/convenios/${c.id}/pagos`)
          const pd = await pr.json()
          console.log(`[LOG pagos convenio ${c.id}]`, pd.pagos);
          if (pr.ok && pd?.success) {
            const pagos: any[] = pd.pagos || []
            pagos
              .filter((p) => p.estado !== "pagado")
              .forEach((p) => {
                const desc = `Convenio de pago - Cuota ${p.numeroPago}/${c.numPayments}`
                all.push({
                  id: String(p.id),
                  convenioId: String(c.id),
                  number: Number(p.numeroPago ?? 0),
                  amount: Number(p.monto ?? 0),
                  dueDate: p.fechaVencimiento || "",
                  status: p.estado || "pendiente",
                  description: desc,
                })
              })
          }
        }
        if (!aborted) setUserAgreements(all)
      } catch (e) {
        console.error(e)
      }
    }
    loadAgreements()
    return () => {
      aborted = true
    }
  }, [user])

  // Inicializar el estado de selección de multas y convenios
  useEffect(() => {
    const finesState = {} as Record<string, boolean>
    const agreementsState = {} as Record<string, boolean>

    // Inicializar todas las multas como no seleccionadas
    userFines.forEach((fine) => {
      finesState[fine.id] = false
    })

    // Inicializar todos los convenios/parcialidades como no seleccionadas
    userAgreements.forEach((agreement) => {
      agreementsState[agreement.id] = false
    })

    // Only update if the keys have actually changed
    setSelectedPayments((prev) => {
      const currentFineKeys = Object.keys(prev.fines).sort()
      const newFineKeys = Object.keys(finesState).sort()
      const currentAgreementKeys = Object.keys(prev.agreements).sort()
      const newAgreementKeys = Object.keys(agreementsState).sort()

      const finesChanged = JSON.stringify(currentFineKeys) !== JSON.stringify(newFineKeys)
      const agreementsChanged = JSON.stringify(currentAgreementKeys) !== JSON.stringify(newAgreementKeys)

      if (finesChanged || agreementsChanged) {
        return {
          ...prev,
          fines: finesState,
          agreements: agreementsState,
        }
      }

      return prev
    })
  }, [userFines, userAgreements])

  // Verificar contra API si ya existe pago del mes actual
  const [hasCurrentMonthPayment, setHasCurrentMonthPayment] = useState(false)
  useEffect(() => {
    let canceled = false
    const check = async () => {
      if (!user) return
      try {
        const m = new Date().getMonth() + 1
        const y = new Date().getFullYear()
        const res = await fetch(`/api/pagos?userId=${encodeURIComponent(user.id)}&month=${m}&year=${y}&status=completed`)
        const data = await res.json()
        if (!canceled) setHasCurrentMonthPayment(Array.isArray(data?.pagos) && data.pagos.length > 0)
      } catch {}
    }
    check()
    return () => { canceled = true }
  }, [user])

  // Determinar si aplicar recargo basado en fecha límite y si no ha pagado
  const today = new Date()
  const currentDay = today.getDate()
  const isLate = currentDay > maintenanceDueDay && !hasCurrentMonthPayment

  // Si el mes actual ya está pagado, desmarcar y bloquear mantenimiento
  useEffect(() => {
    if (hasCurrentMonthPayment) {
      setSelectedPayments((prev) => ({ ...prev, maintenance: false }))
    }
  }, [hasCurrentMonthPayment])

  // Calcular el monto a pagar basado en las selecciones
  const maintenanceAmount = selectedPayments.maintenance
    ? isLate
      ? maintenancePrice + maintenanceLatePaymentFee
      : maintenancePrice
    : 0

  // Calcular monto de pagos adelantados
  const advancePaymentAmount = advanceMonths * maintenancePrice

  // Calcular el monto de multas seleccionadas
  const finesAmount = userFines.reduce((sum, fine) => {
    if (selectedPayments.fines[fine.id]) {
      // Si la multa está vencida, usar el monto con recargo
      return sum + (fine.status === "overdue" ? fine.amount + fine.lateFee : fine.amount)
    }
    return sum
  }, 0)

  // Calcular el monto de convenios seleccionados
  const agreementsAmount = userAgreements.reduce((sum, agreement) => {
    return sum + (selectedPayments.agreements[agreement.id] ? agreement.amount : 0)
  }, 0)

  const totalAmount = maintenanceAmount + finesAmount + agreementsAmount + advancePaymentAmount

  // Función para manejar la selección de todas las multas
  const handleSelectAllFines = (checked: boolean) => {
    const newFinesState = { ...selectedPayments.fines }
    userFines.forEach((fine) => {
      newFinesState[fine.id] = checked
    })

    setSelectedPayments((prev) => ({
      ...prev,
      fines: newFinesState,
    }))
  }

  // Función para manejar la selección de todos los convenios
  const handleSelectAllAgreements = (checked: boolean) => {
    const newAgreementsState = { ...selectedPayments.agreements }
    userAgreements.forEach((agreement) => {
      newAgreementsState[agreement.id] = checked
    })

    setSelectedPayments((prev) => ({
      ...prev,
      agreements: newAgreementsState,
    }))
  }

  // Función para manejar la selección de una multa individual
  const handleSelectFine = (fineId: string, checked: boolean) => {
    setSelectedPayments((prev) => ({
      ...prev,
      fines: {
        ...prev.fines,
        [fineId]: checked,
      },
    }))
  }

  // Función para manejar la selección de un convenio individual
  const handleSelectAgreement = (agreementId: string, checked: boolean) => {
    setSelectedPayments((prev) => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [agreementId]: checked,
      },
    }))
  }

  // Versión simplificada de la función generateReference()
  const generateReference = () => {
    if (!user) return "REF-INVALIDA"

    // Extraer solo los números de la casa (o usar los últimos 2-3 caracteres si no hay números)
    const houseMatch = user.house.match(/\d+/)
    const houseNum = houseMatch ? houseMatch[0] : user.house.slice(-2)

    // Crear un código simple para el tipo de pago
    let typeCode = ""
    if (selectedPayments.maintenance) typeCode += "M"

    // Contar cuántas multas y convenios están seleccionados
    const finesCount = Object.values(selectedPayments.fines).filter(Boolean).length
    const agreementsCount = Object.values(selectedPayments.agreements).filter(Boolean).length

    if (finesCount > 0) typeCode += "F"
    if (agreementsCount > 0) typeCode += "C"

    // Generar un número aleatorio de 3 dígitos para hacer la referencia única
    const randomNum = Math.floor(Math.random() * 900) + 100

    // Formato final: CASA-TIPO-RANDOM
    // Ejemplo: 42-MFC-123
    return `${houseNum}-${typeCode}-${randomNum}`
  }

  // Generar una vez si no existe cuando el usuario interactúa
  useEffect(() => {
    if (!reference && user) {
      setReference(generateReference())
    }
  }, [reference, user])

  // Función para copiar la referencia al portapapeles
  const copyReference = () => {
    const ref = reference || generateReference()
    if (!reference) setReference(ref)
    navigator.clipboard.writeText(ref)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert("Error: Usuario no encontrado")
      return
    }

  // Asegurar referencia estable
  let ref = reference
  if (!ref) { ref = generateReference(); setReference(ref) }

  // Crear el desglose del pago basado en las selecciones
    const breakdown: PaymentBreakdown = {}

  if (selectedPayments.maintenance) {
      breakdown.maintenance = maintenancePrice
      if (isLate) {
        breakdown.surcharges = maintenanceLatePaymentFee
      }
    }

    // Agregar multas seleccionadas
    const selectedFines = userFines.filter((fine) => selectedPayments.fines[fine.id])
    if (selectedFines.length > 0) {
      breakdown.fines = selectedFines.map((fine) => ({
        id: fine.id,
        description: fine.reason,
        amount: fine.status === "overdue" ? fine.amount + fine.lateFee : fine.amount,
      }))
    }

    // Agregar convenios seleccionados (parcialidades)
    const selectedAgreements = userAgreements.filter((agreement) => selectedPayments.agreements[agreement.id])
    if (selectedAgreements.length > 0) {
      breakdown.agreements = selectedAgreements.map((agreement) => ({
        id: agreement.id,
        description: agreement.description,
        amount: agreement.amount,
      }))
    }

    // Agregar pagos adelantados si se seleccionaron
    if (advanceMonths > 0) {
      const advancePayments = []
      for (let i = 1; i <= advanceMonths; i++) {
        const futureDate = new Date()
        futureDate.setMonth(futureDate.getMonth() + i)
        advancePayments.push({
          month: futureDate.getMonth() + 1,
          year: futureDate.getFullYear(),
          amount: maintenancePrice,
        })
      }
      breakdown.advancePayments = advancePayments
    }

    // Crear información del residente (básica)
    const fullName = `${user.firstName} ${user.lastName}`.trim()
    const residentInfo = {
      name: fullName,
      street: user.house.includes("Paseo") ? "Paseo del Cedro" : "Calle Principal",
      houseNumber: user.house.match(/\d+/)?.[0] || user.house,
      phone: user.phone || "",
      email: user.email || "",
    }

  // Si aplica recargo y se paga mantenimiento, crear registro 'atrasado' (monto 0) para el periodo actual
  if (selectedPayments.maintenance && isLate) {
    try {
      const month = new Date().getMonth() + 1
      const year = new Date().getFullYear()
      await fetch("/api/pagos/atraso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, month, year }),
      })
    } catch (e) {
      console.warn("No se pudo crear registro atrasado:", e)
    }
  }

  // Si es tarjeta, mostrar Stripe y detener aquí; Stripe llamará onSuccess
  if (paymentMethod === "card") {
    setShowStripe(true)
    return
  }

  // Registrar en la tabla general `pagos` (transferencia => procesando) y obtener id
  let generalPaymentId: string | number | null = null
  try {
    // Definir tipo según selección (mixto si más de una categoría)
    const categories = [
      selectedPayments.maintenance ? 'mantenimiento' : null,
      Object.values(selectedPayments.fines).some(Boolean) ? 'multas' : null,
      Object.values(selectedPayments.agreements).some(Boolean) ? 'convenio' : null,
    ].filter(Boolean) as string[]
    const pagoTipo = categories.length > 1 ? 'mixto' : (categories[0] || 'mantenimiento')
    const generalPayload = {
      usuario_id: user.id,
      referencia_id: ref,
      tipo: pagoTipo,
      monto: totalAmount,
      metodo_pago: "transferencia",
      estado: "procesando",
      notas: "Pago por transferencia en verificación",
    }
  console.log("[PAYMENT][TRANSFER][GENERAL] payload:", generalPayload)
  const gpRes = await fetch("/api/pagos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(generalPayload) })
    const gpData = await gpRes.json()
  console.log("[PAYMENT][TRANSFER][GENERAL] response:", gpRes.status, gpData)
    if (gpRes.ok && gpData?.success && gpData?.pago?.id) generalPaymentId = gpData.pago.id
  } catch (e) {
    console.warn("No se pudo registrar el pago en tabla general 'pagos':", e)
  }

  // Registrar/actualizar tablas específicas (marcar pagado) según selección
  try {
    // 1) Construir items para mantenimiento (actual si se seleccionó) + adelantos (si se eligieron)
    const items: { month: number; year: number; amount: number }[] = []
    if (selectedPayments.maintenance) {
      const month = new Date().getMonth() + 1
      const year = new Date().getFullYear()
      items.push({ month, year, amount: maintenancePrice })
    }
    if (advanceMonths > 0) {
      for (let i = 1; i <= advanceMonths; i++) {
        const d = new Date(); d.setMonth(d.getMonth() + i)
        items.push({ month: d.getMonth() + 1, year: d.getFullYear(), amount: maintenancePrice })
      }
    }
  if (items.length > 0) {
  const maintPayload = { userId: user.id, items, pago_id: generalPaymentId, referencia_id: ref, estado: "procesando", due_day: maintenanceDueDay }
      console.log("[PAYMENT][TRANSFER][MANTENIMIENTO] payload:", maintPayload)
      const resp = await fetch("/api/pagos/mantenimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(maintPayload),
      })
      let rj: any = null; try { rj = await resp.json() } catch {}
      console.log("[PAYMENT][TRANSFER][MANTENIMIENTO] response:", resp.status, rj)
      if (resp.status === 404) {
        alert("No se encontró una propiedad asignada al usuario. Contacte a administración.")
      }
      if (!resp.ok) {
        console.warn("Fallo al registrar pagos_mantenimiento (transferencia):", rj)
      }
    }

    // 2) Parcialidades de convenio seleccionadas -> asociar pago (mantener estado 'pendiente')
    const selectedAgreementIds = userAgreements.filter(a => selectedPayments.agreements[a.id]).map(a => a.id)
  if (selectedAgreementIds.length) {
  const agPayloads = selectedAgreementIds.map((id) => ({ estado: "procesando", pago_id: generalPaymentId }))
  console.log("[PAYMENT][TRANSFER][CONVENIOS] patches:", selectedAgreementIds.map((id, ix) => ({ id, ...agPayloads[ix] })))
      await Promise.all(selectedAgreementIds.map((id, ix) => fetch(`/api/convenios/pagos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agPayloads[ix]),
      })))
    }

    // 3) Multas seleccionadas -> asociar pago (mantener estado pendiente)
    const selectedFineIds = userFines.filter(f => selectedPayments.fines[f.id]).map(f => f.id)
  if (selectedFineIds.length) {
  const multasPayload = { ids: selectedFineIds, estado: "procesando", pago_id: generalPaymentId }
      console.log("[PAYMENT][TRANSFER][MULTAS] payload:", multasPayload)
      const r = await fetch("/api/multas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(multasPayload),
      })
      let rj: any = null; try { rj = await r.json() } catch {}
      console.log("[PAYMENT][TRANSFER][MULTAS] response:", r.status, rj)
      if (!r.ok) {
        console.warn("Fallo al vincular multas (transferencia):", rj)
      }
    }
  } catch (e) {
    console.warn("Error actualizando tablas específicas tras transferencia:", e)
  }

  if (paymentMethod === "transfer") {
    // Construir resumen vinculado para mostrar en el ticket
    const maintItems: { month: number; year: number; amount: number }[] = []
    if (selectedPayments.maintenance) {
      const d0 = new Date(); maintItems.push({ month: d0.getMonth() + 1, year: d0.getFullYear(), amount: maintenancePrice })
      if (advanceMonths > 0) {
        for (let i = 1; i <= advanceMonths; i++) {
          const d = new Date(); d.setMonth(d.getMonth() + i)
          maintItems.push({ month: d.getMonth() + 1, year: d.getFullYear(), amount: maintenancePrice })
        }
      }
    }
    const finesItems = userFines.filter(f => selectedPayments.fines[f.id]).map(f => ({ id: f.id, reason: f.reason, amount: f.status === "overdue" ? f.amount + f.lateFee : f.amount }))
    const agItems = userAgreements.filter(a => selectedPayments.agreements[a.id]).map(a => ({ id: a.id, description: a.description, amount: a.amount }))
  setTransferLinked({ pagoId: generalPaymentId, maintenance: maintItems, fines: finesItems, agreements: agItems })
    setShowTicket(true)
  }
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
        <div className="bg-white rounded-lg p-6 w-full max-w-md text-gray-800 mx-auto">
          <h2 className="text-xl font-semibold mb-4">Información de Pago</h2>

          {/* Información de fecha límite */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-start">
            <Calendar className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Fecha límite de pago:</span> Día {maintenanceDueDay} de cada mes
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Los pagos realizados después de esta fecha tendrán un recargo de $
                {maintenanceLatePaymentFee.toLocaleString()}
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handlePaymentSubmit}>
            {/* La propiedad ya no se selecciona manualmente: se resuelve desde la BD por usuario */}

            {/* Selección de pagos */}
            <div className="space-y-3 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-sm border-b pb-2 mb-2">Seleccione lo que desea pagar:</h3>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="maintenance"
                  checked={selectedPayments.maintenance}
                  onCheckedChange={(checked) =>
                    setSelectedPayments({ ...selectedPayments, maintenance: checked === true })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="maintenance"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mantenimiento mensual
                  </label>
                  <p className="text-xs text-muted-foreground">
                    ${maintenancePrice.toLocaleString()}
                    {isLate && (
                      <span className="text-red-500"> + ${maintenanceLatePaymentFee.toLocaleString()} (recargo)</span>
                    )}
                  </p>
                </div>
              </div>

              {userFines.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Multas pendientes</h4>
                    <div className="flex items-center">
                      <Checkbox
                        id="select-all-fines"
                        checked={
                          Object.values(selectedPayments.fines).every((v) => v === true) &&
                          Object.keys(selectedPayments.fines).length > 0
                        }
                        onCheckedChange={(checked) => handleSelectAllFines(checked === true)}
                      />
                      <label htmlFor="select-all-fines" className="ml-2 text-xs text-gray-600">
                        Seleccionar todas
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 pl-2">
                    {userFines.map((fine) => (
                      <div key={fine.id} className="flex items-start space-x-2 bg-gray-50 p-2 rounded">
                        <Checkbox
                          id={fine.id}
                          checked={selectedPayments.fines[fine.id] || false}
                          onCheckedChange={(checked) => handleSelectFine(fine.id, checked === true)}
                        />
                        <div className="grid gap-0.5 leading-none flex-1">
                          <div className="flex justify-between items-center">
                            <label
                              htmlFor={fine.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {fine.reason}
                            </label>
                            <div className="text-right">
                              {fine.status === "overdue" ? (
                                <div>
                                  <span className="line-through text-gray-500 text-xs">
                                    ${fine.amount.toLocaleString()}
                                  </span>
                                  <span className="block font-semibold text-red-600 text-sm">
                                    ${(fine.amount + fine.lateFee).toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-semibold">${fine.amount.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                              Vencimiento: {new Date(fine.dueDate).toLocaleDateString()}
                            </p>
                            {fine.status === "overdue" && (
                              <span className="text-xs text-red-600 font-medium">VENCIDA</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {userAgreements.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Convenios de pago</h4>
                    <div className="flex items-center">
                      <Checkbox
                        id="select-all-agreements"
                        checked={
                          Object.values(selectedPayments.agreements).every((v) => v === true) &&
                          Object.keys(selectedPayments.agreements).length > 0
                        }
                        onCheckedChange={(checked) => handleSelectAllAgreements(checked === true)}
                      />
                      <label htmlFor="select-all-agreements" className="ml-2 text-xs text-gray-600">
                        Seleccionar todas
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 pl-2">
                    {userAgreements.map((agreement) => {
                      const overdue = agreement.status !== "pagado" && agreement.dueDate && new Date(agreement.dueDate) < new Date()
                      return (
                      <div key={agreement.id} className="flex items-start space-x-2 bg-gray-50 p-2 rounded">
                        <Checkbox
                          id={agreement.id}
                          checked={selectedPayments.agreements[agreement.id] || false}
                          onCheckedChange={(checked) => handleSelectAgreement(agreement.id, checked === true)}
                        />
                        <div className="grid gap-0.5 leading-none flex-1">
                          <div className="flex justify-between items-center">
                            <label
                              htmlFor={agreement.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {agreement.description}
                            </label>
                            <span className={`text-sm font-semibold ${overdue ? "text-red-600" : ""}`}>${agreement.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">Vencimiento: {agreement.dueDate ? new Date(agreement.dueDate).toLocaleDateString() : ""}</p>
                            {overdue && <span className="text-xs text-red-600 font-medium">VENCIDA</span>}
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              )}
            </div>

            {/* Sección de pagos adelantados */}
            <div className="mt-4 border-t pt-3">
              <h4 className="text-sm font-medium mb-3">Adelantar pagos de meses siguientes</h4>

              {availableAdvanceMonths.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="advance-months" className="text-sm font-medium">
                      Meses a adelantar:
                    </label>
                    <select
                      id="advance-months"
                      value={advanceMonths}
                      onChange={(e) => setAdvanceMonths(Number(e.target.value))}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a9eff] text-gray-800"
                    >
                      <option value={0}>Seleccionar cantidad</option>
                      {availableAdvanceMonths.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.value} mes{month.value > 1 ? "es" : ""} (hasta {month.label})
                        </option>
                      ))}
                    </select>
                  </div>

                  {advanceMonths > 0 && (
                    <div className="bg-green-50 p-3 rounded-md">
                      <p className="text-sm text-green-700">
                        <span className="font-medium">Pagos adelantados:</span> {advanceMonths} mes
                        {advanceMonths > 1 ? "es" : ""}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Monto: ${(advanceMonths * maintenancePrice).toLocaleString()}
                      </p>
                      <div className="mt-2 text-xs text-green-600">
                        <p className="font-medium">Meses que se pagarán:</p>
                        {Array.from({ length: advanceMonths }, (_, i) => {
                          const futureDate = new Date()
                          futureDate.setMonth(futureDate.getMonth() + i + 1)
                          return (
                            <span key={i} className="inline-block mr-2">
                              • {futureDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    No hay meses disponibles para adelantar. Todos los pagos futuros ya están al corriente.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium">
                Monto a pagar
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                <input
                  type="number"
                  id="amount"
                  value={totalAmount}
                  readOnly
                  className="w-full p-2 pl-7 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a9eff] bg-gray-50 text-gray-800"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Total a pagar</p>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setShowLatePaymentInfo(!showLatePaymentInfo)}
                >
                  Ver desglose
                </button>
              </div>

              {/* Actualizar la sección de desglose para mostrar solo los elementos seleccionados */}
              {showLatePaymentInfo && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm">
                  {selectedPayments.maintenance && (
                    <>
                      <div className="flex justify-between mb-1">
                        <span>Cuota de mantenimiento:</span>
                        <span>${maintenancePrice.toLocaleString()}</span>
                      </div>
                      {isLate && (
                        <div className="flex justify-between text-red-600">
                          <span>Recargo por pago tardío:</span>
                          <span>${maintenanceLatePaymentFee.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}

                  {userFines.map(
                    (fine) =>
                      selectedPayments.fines[fine.id] && (
                        <div key={fine.id} className="flex justify-between mb-1">
                          <span>Multa: {fine.reason}</span>
                          <span>
                            ${(fine.status === "overdue" ? fine.amount + fine.lateFee : fine.amount).toLocaleString()}
                          </span>
                        </div>
                      ),
                  )}

                  {userAgreements.map(
                    (agreement) =>
                      selectedPayments.agreements[agreement.id] && (
                        <div key={agreement.id} className="flex justify-between mb-1">
                          <span>{agreement.description}</span>
                          <span>${agreement.amount.toLocaleString()}</span>
                        </div>
                      ),
                  )}

                  {advanceMonths > 0 && (
                    <div className="flex justify-between mb-1 text-green-600">
                      <span>
                        Pagos adelantados ({advanceMonths} mes{advanceMonths > 1 ? "es" : ""}):
                      </span>
                      <span>${(advanceMonths * maintenancePrice).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 mt-2 pt-2 font-medium flex justify-between">
                    <span>Total:</span>
                    <span>${totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {isLate && selectedPayments.maintenance && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Pago con recargo</p>
                    <p>
                      Se ha aplicado un recargo de ${maintenanceLatePaymentFee.toLocaleString()} por pago después del
                      día límite.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="payment-method" className="block text-sm font-medium">
                Método de pago
              </label>
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value)
                  setShowBankDetails(e.target.value === "transfer")
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4a9eff] text-gray-800"
              >
                <option value="">Seleccionar método de pago</option>
                <option value="card">Tarjeta de crédito/débito</option>
                <option value="transfer">Transferencia bancaria</option>
              </select>
            </div>

            {/* Mostrar datos bancarios si se selecciona transferencia */}
            {showBankDetails && (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-600" />
                  Datos para transferencia
                </h3>

                {bankingDetails ? (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-500">Banco</p>
                      <p className="font-medium">{bankingDetails.bankName}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">Titular</p>
                      <p className="font-medium">{bankingDetails.accountHolder}</p>
                    </div>

                    <div>
                      <p className="text-gray-500">CLABE</p>
                      <p className="font-medium">{bankingDetails.clabe}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <p className="text-gray-500">Referencia</p>
                        <button
                          type="button"
                          onClick={copyReference}
                          className="text-xs text-blue-600 flex items-center"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-medium bg-blue-50 p-2 rounded mt-1 text-center">{reference}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Esta referencia incluye información sobre su pago. Por favor úsela exactamente como se muestra.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">No hay datos bancarios disponibles</p>
                        <p className="text-xs text-red-700 mt-1">
                          Por favor contacte a la administración para obtener los datos bancarios actualizados.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {bankingDetails && (
                  <div className="mt-4 bg-blue-50 p-3 rounded-md flex items-start">
                    <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Una vez realizada la transferencia, por favor envíe el comprobante de pago a la administración
                      para registrar su pago. Incluya la referencia en el concepto de la transferencia.
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#4a9eff] hover:bg-[#3b8de0] text-white"
              disabled={!paymentMethod}
            >
              {paymentMethod === "transfer" ? "Confirmar pago por transferencia" : "Continuar con el pago"}
            </Button>
          </form>

          {/* Pago con tarjeta via Stripe */}
          {showStripe && paymentMethod === "card" && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Pago con tarjeta</h3>
              <StripeCardPayment
                amount={Number(totalAmount)}
                referencia={reference}
                onSuccess={async (paymentIntent: any) => {
                  try {
                    // Registrar en tabla general `pagos` como completado
                    const categories = [
                      selectedPayments.maintenance ? 'mantenimiento' : null,
                      Object.values(selectedPayments.fines).some(Boolean) ? 'multas' : null,
                      Object.values(selectedPayments.agreements).some(Boolean) ? 'convenio' : null,
                    ].filter(Boolean) as string[]
                    const pagoTipo = categories.length > 1 ? 'mixto' : (categories[0] || 'mantenimiento')
                    const generalPayload = {
                      usuario_id: user?.id,
                      referencia_id: reference,
                      tipo: pagoTipo,
                      monto: totalAmount,
                      metodo_pago: "tarjeta",
                      estado: "completado",
                      notas: `Stripe: ${paymentIntent.status}. ID: ${paymentIntent.id}`,
                    }
                    console.log("[PAYMENT][CARD][GENERAL] payload:", generalPayload)
                    const pagoRes = await fetch("/api/pagos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(generalPayload) })
                    const pagoData = await pagoRes.json()
                    console.log("[PAYMENT][CARD][GENERAL] response:", pagoRes.status, pagoData)
                    const paymentId = pagoData?.pago?.id ? String(pagoData.pago.id) : `temp-${Date.now()}`

                    // Si hay convenios seleccionados, marcarlos como pagados
                    const now = new Date().toISOString().slice(0, 19).replace("T", " ")
                    if (userAgreements && Object.values(selectedPayments.agreements).some(Boolean)) {
                      const selected = userAgreements.filter(a => selectedPayments.agreements[a.id])
                      const agCardPayloads = selected.map((a) => ({ estado: "pagado", fecha_pago: now, pago_id: paymentId }))
                      console.log("[PAYMENT][CARD][CONVENIOS] patches:", selected.map((a, ix) => ({ id: a.id, ...agCardPayloads[ix] })))
                      await Promise.all(selected.map((a, ix) => fetch(`/api/convenios/pagos/${a.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(agCardPayloads[ix]),
                      })))
                    }

                    // Marcar mantenimiento del mes actual (si aplica) y meses adelantados
                    const items = [] as { month: number; year: number; amount: number }[]
                    if (selectedPayments.maintenance) {
                      const d0 = new Date(); items.push({ month: d0.getMonth() + 1, year: d0.getFullYear(), amount: maintenancePrice })
                    }
                    if (advanceMonths > 0) {
                      for (let i = 1; i <= advanceMonths; i++) {
                        const d = new Date(); d.setMonth(d.getMonth() + i)
                        items.push({ month: d.getMonth() + 1, year: d.getFullYear(), amount: maintenancePrice })
                      }
                    }
                    if (items.length > 0) {
                      const maintCardPayload = { userId: user?.id, items, pago_id: paymentId, referencia_id: reference, estado: "pagado", due_day: maintenanceDueDay }
                      console.log("[PAYMENT][CARD][MANTENIMIENTO] payload:", maintCardPayload)
                      const r = await fetch("/api/pagos/mantenimiento", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(maintCardPayload),
                      })
                      let rj: any = null; try { rj = await r.json() } catch {}
                      console.log("[PAYMENT][CARD][MANTENIMIENTO] response:", r.status, rj)
                      if (r.status === 404) {
                        alert("No se encontró una propiedad asignada al usuario. Contacte a administración.")
                      }
                    }

                    // Marcar multas seleccionadas como pagadas
                    const selectedFineIds = userFines.filter(f => selectedPayments.fines[f.id]).map(f => f.id)
                    if (selectedFineIds.length) {
                      const multasCardPayload = { ids: selectedFineIds, estado: "pagada", pago_id: paymentId }
                      console.log("[PAYMENT][CARD][MULTAS] payload:", multasCardPayload)
                      const mr = await fetch("/api/multas", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(multasCardPayload),
                      })
                      let mrj: any = null; try { mrj = await mr.json() } catch {}
                      console.log("[PAYMENT][CARD][MULTAS] response:", mr.status, mrj)
                    }

                    alert("¡Pago con tarjeta procesado exitosamente!")
                    window.location.href = "/home"
                  } catch (err) {
                    alert("Pago realizado pero ocurrió un problema registrándolo. Contacte a administración.")
                  }
                }}
                onError={(err: any) => alert(err?.message || "Error al procesar pago")}
              />
            </div>
          )}
          {showTicket && paymentMethod === "transfer" && (
            <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-center mb-4">Ticket de Pago</h3>

              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-center font-medium">
                    Por favor realiza tu transferencia con los siguientes datos:
                  </p>
                </div>

                {bankingDetails ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-gray-500 text-sm">Banco</p>
                      <p className="font-medium">{bankingDetails.bankName}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm">Titular</p>
                      <p className="font-medium">{bankingDetails.accountHolder}</p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm">CLABE</p>
                      <p className="font-medium">{bankingDetails.clabe}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-gray-500 text-sm">Monto a transferir</p>
                      <p className="font-bold text-lg">${totalAmount.toLocaleString()}</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-500 text-sm">Referencia (incluir en concepto)</p>
                        <button
                          type="button"
                          onClick={copyReference}
                          className="text-xs text-blue-600 flex items-center"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar
                            </>
                          )}
                        </button>
                      </div>
                      <p className="font-medium bg-blue-50 p-2 rounded mt-1 text-center">{reference}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">No hay datos bancarios disponibles</p>
                        <p className="text-xs text-red-700 mt-1">
                          Por favor contacte a la administración para obtener los datos bancarios actualizados.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 bg-yellow-50 p-3 rounded-md flex items-start">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                  <p className="text-xs text-yellow-700">
                    Una vez realizada la transferencia, por favor envía el comprobante de pago a la administración para
                    registrar tu pago. Tu pago será procesado en un plazo de 24-48 horas hábiles.
                  </p>
                </div>

                {transferLinked && (
                  <div className="mt-4 border border-gray-200 rounded-md p-3 bg-gray-50">
                    <p className="text-sm font-semibold mb-2">Resumen de conceptos vinculados</p>
                    {transferLinked.pagoId != null && (
                      <p className="text-xs text-gray-600 mb-1">ID de verificación: <span className="font-mono">{String(transferLinked.pagoId)}</span></p>
                    )}
                    {transferLinked.maintenance.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 font-medium">Mantenimiento</p>
                        <ul className="mt-1 space-y-1 text-xs">
                          {transferLinked.maintenance.map((m, i) => (
                            <li key={`${m.year}-${m.month}-${i}`} className="flex justify-between">
                              <span>{new Date(m.year, m.month - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</span>
                              <span>${m.amount.toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {transferLinked.agreements.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 font-medium">Convenios</p>
                        <ul className="mt-1 space-y-1 text-xs">
                          {transferLinked.agreements.map((a) => (
                            <li key={a.id} className="flex justify-between"><span>{a.description}</span><span>${a.amount.toLocaleString()}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {transferLinked.fines.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-600 font-medium">Multas</p>
                        <ul className="mt-1 space-y-1 text-xs">
                          {transferLinked.fines.map((f) => (
                            <li key={f.id} className="flex justify-between"><span>{f.reason}</span><span>${f.amount.toLocaleString()}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 mt-4">
                  <Button className="w-full bg-[#4a9eff] hover:bg-[#3b8de0] text-white" onClick={downloadTransferTicket}>
                    Descargar ticket (PDF)
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => { setShowTicket(false); window.location.href = "/home" }}>
                    Ir al inicio
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
