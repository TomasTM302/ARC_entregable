"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Download, Printer, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react"
import { useAuthStore } from "@/lib/auth"
import AuthGuard from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import dynamic from "next/dynamic"
import type { MaintenancePayment } from "@/lib/types"
const ChartsSection = dynamic(() => import("@/components/admin/estado-resultados/ChartsSection"), { ssr: false })
import { useEffect } from "react"
import { cn } from "@/lib/utils"

// Array de nombres de meses
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

// Datos financieros iniciales
const initialFinancialData = {
  title: "REPORTE FINANCIERO",
  subtitle: "ESTADO DE RESULTADOS",
  period: "ACUMULADO A DICIEMBRE 2024",
  totalQuotas: 100,
  morosityByMonth: [2, 2, 2, 3, 2, 5, 3, 3],
  annualitiesByMonth: [1, 1, 1, 1, 1, 1, 1, 1],
  quotasByMonth: [97, 97, 97, 96, 97, 94, 96, 96],
  months: ["Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  monthlyQuota: 950,
  income: [
    {
      concept: "Saldo Inicial",
      detail: "",
      amounts: [7982.82, 17948.23, 23809.79, 12270.59, 16691.47, 10145.07, 16027.79, 23819.01],
    },
    {
      concept: "CUOTAS DE MANTENIMIENTO INGRESADAS",
      detail: "Cuota mensual",
      amounts: [72000.0, 81000.0, 74360.0, 77155.0, 79000.0, 84400.0, 81695.0, 83595.0],
    },
    {
      concept: "ANUALIDADES",
      detail: "Cuotas amortizadas mes",
      amounts: [1800.0, 900.0, 900.0, 900.0, 900.0, 900.0, 900.0, 0],
    },
    {
      concept: "CUOTAS RECUPERADAS MES ANTERIOR",
      detail: "Cuotas morosos",
      amounts: [1800.0, 0, 900.0, 900.0, 1800.0, 1250.0, 150.0, 3755.0],
    },
    {
      concept: "CUOTAS ADELANTADAS",
      detail: "Cuotas ordinarias",
      amounts: [3717.0, 18592.0, 8125.0, 5462.0, 9507.0, 12357.0, 2858.5, 6657.5],
    },
    {
      concept: "CUOTAS Y PAGOS SIN IDENTIFICAR",
      detail: "Sin identificar",
      amounts: [0, 0, 0, 0, 0, 0, 0, 0],
    },
    {
      concept: "MULTAS",
      detail: "Infracción al reglamento",
      amounts: [6500.0, 3000.0, 500.0, 1000.0, 1500.0, 2500.0, 0, 2200.0],
    },
    {
      concept: "EVENTOS EN ÁREAS",
      detail: "Áreas comunes",
      amounts: [1500.0, 1000.0, 1000.0, 0, 500.0, 500.0, 1000.0, 0],
    },
    {
      concept: "CONVENIOS CON MOROSOS",
      detail: "Acuerdo de pagos",
      amounts: [0, 1190.0, 240.0, 0, 1800.0, 1890.0, 1890.0, 700.0],
    },
    {
      concept: "OTROS INGRESOS",
      detail: "",
      amounts: [0, 0, 0, 0, 814.18, 0, 0, 5500.0],
    },
    {
      concept: "CUOTAS EXTRAORDINARIAS",
      detail: "Aportaciones extras",
      amounts: [0, 25550.0, 43750.0, 54180.17, 0, 0, 0, 0],
    },
  ],
  expenses: [
    {
      concept: "GESTION DE SERVICIOS RESIDENCIALES SA DE CV",
      detail: "Honorarios",
      amounts: [16000.0, 16000.0, 16000.0, 16000.0, 16000.0, 16000.0, 16000.0, 16000.0],
    },
    {
      concept: "JUDITH ELIZABETH ALVAREZ MEDINA",
      detail: "Jardineria",
      amounts: [13200.0, 13200.0, 13200.0, 13200.0, 13200.0, 13200.0, 13200.0, 13200.0],
    },
    {
      concept: "JUAN CARLOS AGUILAR QUINTERO",
      detail: "Alberca",
      amounts: [4800.0, 4800.0, 10700.0, 10380.0, 10450.0, 5508.0, 2500.0, 2500.0],
    },
    {
      concept: "SEGURIDAD PRIVADA REGION CENTRO GUTCAS, SA CV",
      detail: "Control de accesos",
      amounts: [33000.0, 33000.0, 33000.0, 33000.0, 33000.0, 33000.0, 33000.0, 33000.0],
    },
    {
      concept: "ECO-CITY",
      detail: "Recol Basura",
      amounts: [6600.0, 13200.0, 6600.0, 0, 6600.0, 6600.0, 6600.0, 13200.0],
    },
    {
      concept: "CFE",
      detail: "Electricidad",
      amounts: [0, 14715.0, 0, 15188.0, 0, 15855.0, 0, 14938.0],
    },
    {
      concept: "ADRIAN DE JESUS JUAREZ TORRES",
      detail: "Insumos limpieza",
      amounts: [415.28, 526.64, 438.0, 549.84, 1315.44, 484.88, 345.68, 816.64],
    },
    {
      concept: "INTERAPAS",
      detail: "Agua potable",
      amounts: [0, 0, 0, 2000.0, 13922.44, 4530.0, 5100.0, 0],
    },
    {
      concept: "MANTENIMIENTO",
      detail: "Mtto y reparaciones",
      amounts: [2200.0, 3100.0, 6100.0, 0, 2600.0, 2100.0, 1200.0, 0],
    },
    {
      concept: "PLAN TARIFARIO CELULAR (COMUNICACIÓN CASETA)",
      detail: "Celular internet",
      amounts: [289.0, 289.0, 289.0, 289.0, 289.0, 289.0, 289.0, 289.0],
    },
    {
      concept: "ARCANGEL JAVIER SOLORIO",
      detail: "Accesos y biometricos",
      amounts: [0, 0, 10149.8, 43847.05, 522.0, 0, 0, 2800.0],
    },
    {
      concept: "IMPUESTOS",
      detail: "Ret de impuestos",
      amounts: [0, 0, 0, 0, 0, 60.0, 0, 0],
    },
    {
      concept: "COMISIONES BANCARIAS",
      detail: "Bajio transferencias",
      amounts: [26.1, 34.8, 17.4, 17.4, 8.7, 17.4, 34.8, 60.9],
    },
    {
      concept: "JAVIER SALAS ARC",
      detail: "Tickets mtto menor",
      amounts: [250.0, 0, 0, 150.0, 0, 200.0, 1827.0, 600.0],
    },
    {
      concept: "GASTOS VARIOS",
      detail: "Varios",
      amounts: [571.21, 955.0, 1070.0, 555.0, 4460.0, 70.0, 605.8, 3546.03],
    },
  ],
  summary: {
    totalIncome: [87317.0, 105682.0, 86025.0, 139597.17, 95821.18, 103797.0, 88493.5, 102407.5],
    totalExpenses: [77351.59, 99820.44, 97564.2, 135176.29, 102367.58, 97914.28, 80702.28, 100950.57],
    periodBalance: [9965.41, 5861.56, -11539.2, 4420.88, -6546.4, 5882.72, 7791.22, 1456.93],
    accumulatedBalance: [17948.23, 23809.79, 12270.59, 16691.47, 10145.07, 16027.79, 23819.01, 25275.94],
  },
  bankInfo: {
    bankBalance: 107117.5,
    guaranteeDeposits: 4000.0,
    interests: 710.0,
    annualizedAmortization: 0,
    otherDeposit: 0,
    interestPayment: 0,
    totalBalance: 102407.5,
  },
  accountsInfo: {
    closingBalance: 33148.21,
    depositAccount: 5000.0,
    unavailableBalance: 3600.0,
    guarantees: "?",
    totalAccounts: 41748.21,
    balance2024: 54644.5,
    arcDifference: 12896.29,
  },
}

// Función auxiliar para obtener el número de mes a partir del nombre
function getMonthNumber(monthName: string) {
  return MONTH_NAMES.indexOf(monthName) + 1
}

// Función auxiliar para obtener el nombre del mes a partir del número
function getMonthName(monthNumber: number) {
  return MONTH_NAMES[monthNumber - 1]
}

// Función para calcular los ingresos por categoría y mes
function calculateIncomeByCategory(
  payments: MaintenancePayment[] = [],
  reservations: Array<{ status: string; paymentStatus: string; date: string; fee?: number }> = [],
  months: string[],
) {
  // Inicializar estructura de datos para cada categoría y mes
  const incomeData = {
    maintenance: Array(months.length).fill(0),
    recovered: Array(months.length).fill(0),
    advance: Array(months.length).fill(0),
    fines: Array(months.length).fill(0),
    agreements: Array(months.length).fill(0),
    commonAreas: Array(months.length).fill(0),
    others: Array(months.length).fill(0),
  }

  // Verificar que payments sea un array antes de usar filter
  if (Array.isArray(payments)) {
    // Procesar cada pago aprobado
    payments
      .filter((payment) => payment.status === "completed")
      .forEach((payment) => {
        // Encontrar el índice del mes en el array de meses
        const paymentDate = new Date(payment.paymentDate)
        const paymentMonth = paymentDate.getMonth()
        const paymentYear = paymentDate.getFullYear()

  const monthIndex = months.findIndex((month, index) => {
          // Asumimos que los meses están en orden y el primer mes es enero del año actual
          const currentYear = new Date().getFullYear()
          const monthNumber = getMonthNumber(month) - 1 // -1 porque getMonth() devuelve 0-11

          // Si el índice es mayor a 11, estamos en el siguiente año
          const year = index > 11 ? currentYear + 1 : currentYear

          return paymentMonth === monthNumber && paymentYear === year
        })

        // Si el mes está en nuestro rango de interés
        if (monthIndex >= 0) {
          // Si el pago tiene desglose, usamos esa información
          if ((payment as any).breakdown) {
            // Cuota de mantenimiento regular
            if ((payment as any).breakdown.maintenance) {
              incomeData.maintenance[monthIndex] += (payment as any).breakdown.maintenance
            }

            // Cuotas recuperadas
            if ((payment as any).breakdown.recoveredPayments) {
              const recoveredTotal = (payment as any).breakdown.recoveredPayments.reduce(
                (sum: number, item: { amount: number }) => sum + item.amount,
                0,
              )
              incomeData.recovered[monthIndex] += recoveredTotal
            }

            // Cuotas adelantadas
            if ((payment as any).breakdown.advancePayments) {
              const advanceTotal = (payment as any).breakdown.advancePayments.reduce(
                (sum: number, item: { amount: number }) => sum + item.amount,
                0,
              )
              incomeData.advance[monthIndex] += advanceTotal
            }

            // Multas
            if ((payment as any).breakdown.fines) {
              const finesTotal = (payment as any).breakdown.fines.reduce(
                (sum: number, fine: { amount: number }) => sum + fine.amount,
                0,
              )
              incomeData.fines[monthIndex] += finesTotal
            }

            // Convenios
            if ((payment as any).breakdown.agreements) {
              const agreementsTotal = (payment as any).breakdown.agreements.reduce(
                (sum: number, agreement: { amount: number }) => sum + agreement.amount,
                0,
              )
              incomeData.agreements[monthIndex] += agreementsTotal
            }

            // Otros ingresos
            if ((payment as any).breakdown.others) {
              const othersTotal = (payment as any).breakdown.others.reduce(
                (sum: number, item: { amount: number }) => sum + item.amount,
                0,
              )
              incomeData.others[monthIndex] += othersTotal
            }
          } else {
            // Si no hay desglose, asumimos que todo es cuota de mantenimiento
            incomeData.maintenance[monthIndex] += payment.amount
          }
        }
      })
  }

  // Verificar que reservations sea un array antes de usar filter
  if (Array.isArray(reservations)) {
    // Procesar pagos de reservaciones de áreas comunes
    reservations
      .filter((reservation) => reservation.status === "confirmed" && reservation.paymentStatus === "paid")
      .forEach((reservation) => {
        const reservationDate = new Date(reservation.date)
        const reservationMonth = reservationDate.getMonth()
        const reservationYear = reservationDate.getFullYear()

  const monthIndex = months.findIndex((month, index) => {
          const currentYear = new Date().getFullYear()
          const monthNumber = getMonthNumber(month) - 1
          const year = index > 11 ? currentYear + 1 : currentYear

          return reservationMonth === monthNumber && reservationYear === year
        })

        if (monthIndex >= 0 && reservation.fee) {
          incomeData.commonAreas[monthIndex] += reservation.fee
        }
      })
  }

  return incomeData
}

export default function EstadoResultadosPage() {
  // Obtener el mes actual del sistema (1-12)
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1 // getMonth() devuelve 0-11, sumamos 1 para tener 1-12
  const currentYear = currentDate.getFullYear()

  const { user } = useAuthStore()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString())
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  // Cargar condominios desde la API y seleccionar uno
  const [condoOptions, setCondoOptions] = useState<Array<{ id: string; name: string }>>([])
  const [selectedCondominium, setSelectedCondominium] = useState("") // guardará el id
  // Modo de visualización de pagos anuales: concentrar (todo en mes de cobro) vs amortizar (mes del periodo)
  const [showAnnualAsSingleMonth, setShowAnnualAsSingleMonth] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    ingresos: true,
    gastos: true,
    saldos: true,
  })

  // Estado para mostrar todos los meses o solo los seleccionados
  const [showAllMonths, setShowAllMonths] = useState(false)

  // Estado para los datos financieros
  const [financialData, setFinancialData] = useState(() => {
    // Inicializar con los datos base y actualizar el título con el condominio seleccionado
    return {
      ...initialFinancialData,
      title: `REPORTE FINANCIERO`,
      period: `ACUMULADO A DICIEMBRE ${selectedYear}`,
    }
  })

  // Cargar datos reales agregados de la API
  const [maintenancePayments, setMaintenancePayments] = useState<MaintenancePayment[]>([])
  const [aggregatedIncome, setAggregatedIncome] = useState<any | null>(null)
  const [metaCounts, setMetaCounts] = useState<{ advanceCount?: number[] } | null>(null)
  useEffect(() => {
    let cancelled = false
    const loadCondos = async () => {
      try {
        const res = await fetch(`/api/condominios?activo=1&simple=1`)
        const data = await res.json()
        if (!cancelled && data?.success && Array.isArray(data.condominiums)) {
          const opts = data.condominiums.map((c: any) => ({ id: String(c.id), name: String(c.name || c.nombre || c.id) }))
          setCondoOptions(opts)
          if (!selectedCondominium && opts.length) {
            // inicializar selección con el primero disponible
            setSelectedCondominium(String(opts[0].id))
          }
        }
      } catch {}
    }
    loadCondos()
    return () => { cancelled = true }
  }, [])

  // cargar ingresos agregados y pagos cuando cambien filtros
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const params = new URLSearchParams({ year: selectedYear })
        if (selectedCondominium) params.set("condominioId", String(selectedCondominium))
        const res = await fetch(`/api/estado-resultados?${params.toString()}`)
        const data = await res.json()
        if (!cancelled && data?.success) {
          setAggregatedIncome(data.income)
          setMetaCounts(data.meta || null)
        }
      } catch {
        if (!cancelled) setAggregatedIncome(null)
      }
      try {
        const res = await fetch("/api/pagos")
        const data = await res.json()
        if (!cancelled && Array.isArray(data?.pagos)) setMaintenancePayments(data.pagos)
      } catch {
        if (!cancelled) setMaintenancePayments([])
      }
    }
    run()
    return () => { cancelled = true }
  }, [selectedYear, selectedCondominium])
  const commonAreaReservations: Array<{ status: string; paymentStatus: string; date: string; fee?: number }> = []

  // Memoizar los meses visibles para evitar recálculos innecesarios
  const visibleMonths = useMemo(() => {
    if (showAllMonths) {
      return financialData.months.map((month) => ({
        monthName: month,
        monthNumber: getMonthNumber(month),
        year: Number.parseInt(selectedYear),
      }))
    }

    // Usar el mes seleccionado como referencia
    const referenceMonth = Number.parseInt(selectedMonth)
    const referenceYear = Number.parseInt(selectedYear)

    // Obtener los 3 meses anteriores al mes seleccionado
    const monthsData = []
    for (let i = 3; i >= 0; i--) {
      let monthIndex = referenceMonth - i
      let year = referenceYear

      // Ajustar para meses anteriores al año actual
      if (monthIndex <= 0) {
        monthIndex += 12
        year -= 1
      }

      // Agregar el nombre del mes
      monthsData.push({
        monthNumber: monthIndex,
        monthName: getMonthName(monthIndex),
        year,
      })
    }

    return monthsData
  }, [showAllMonths, selectedMonth, selectedYear, financialData.months])

  // Memoizar los índices de los meses visibles
  const visibleMonthIndices = useMemo(() => {
    if (showAllMonths) {
      return Array.from({ length: financialData.months.length }, (_, i) => i)
    }

    return visibleMonths.map(({ monthName }) => financialData.months.indexOf(monthName)).filter((index) => index !== -1)
  }, [visibleMonths, showAllMonths, financialData.months])

  // Calcular ingresos por categoría basados en pagos reales
  const incomeByCategory = useMemo(() => {
    // Si tenemos datos agregados del backend, mapearlos a los 8 meses visibles de initialFinancialData
    if (aggregatedIncome) {
      // initialFinancialData.months incluye meses específicos del reporte (p.ej. Mayo..Dic). Mapeamos por nombre.
      const byNameToIndex = (name: string) => getMonthNumber(name) - 1 // 0..11
      const mapSeries = (series12: number[]) => initialFinancialData.months.map((m) => series12[byNameToIndex(m)] || 0)
      const series = {
        maintenance: mapSeries(aggregatedIncome.maintenance || Array(12).fill(0)),
        recovered: mapSeries(aggregatedIncome.recovered || Array(12).fill(0)),
        advance: mapSeries(aggregatedIncome.advance || Array(12).fill(0)),
        annualities: mapSeries(aggregatedIncome.annualities || Array(12).fill(0)),
        fines: mapSeries(aggregatedIncome.fines || Array(12).fill(0)),
        agreements: mapSeries(aggregatedIncome.agreements || Array(12).fill(0)),
        commonAreas: mapSeries(aggregatedIncome.commonAreas || Array(12).fill(0)),
        others: mapSeries(aggregatedIncome.others || Array(12).fill(0)),
      }
      // Evitar doble conteo: mostrar EITHER 'advance' OR 'annualities' según el toggle
      if (showAnnualAsSingleMonth) {
        series.annualities = Array(initialFinancialData.months.length).fill(0)
      } else {
        series.advance = Array(initialFinancialData.months.length).fill(0)
      }
      return series
    }
    return calculateIncomeByCategory(maintenancePayments, commonAreaReservations, financialData.months)
  }, [aggregatedIncome, maintenancePayments, commonAreaReservations, financialData.months, showAnnualAsSingleMonth])

  // Computed financial data
  const computedFinancialData = useMemo(() => {
    const baseData = {
      ...initialFinancialData,
      title: `REPORTE FINANCIERO ${(() => {
        const found = condoOptions.find((c) => String(c.id) === String(selectedCondominium))
        return found ? found.name : ""
      })()}`,
      period: `ACUMULADO A DICIEMBRE ${selectedYear}`,
    }

    // Update income categories if we have calculated data
  if (incomeByCategory) {
      // Update maintenance payments
      if (incomeByCategory.maintenance) {
        baseData.income[1].amounts = incomeByCategory.maintenance
      }
      // Update other categories similarly...
      if (incomeByCategory.recovered) {
        baseData.income[3].amounts = incomeByCategory.recovered
      }
      if (incomeByCategory.advance) {
        baseData.income[4].amounts = incomeByCategory.advance
      }
      if ((incomeByCategory as any).annualities) {
        baseData.income[2].amounts = (incomeByCategory as any).annualities
      }
      if (incomeByCategory.fines) {
        baseData.income[6].amounts = incomeByCategory.fines
      }
      if (incomeByCategory.agreements) {
        baseData.income[8].amounts = incomeByCategory.agreements
      }
      if (incomeByCategory.commonAreas) {
        baseData.income[7].amounts = incomeByCategory.commonAreas
      }
      if (incomeByCategory.others) {
        baseData.income[9].amounts = incomeByCategory.others
      }

  // Si estamos usando datos agregados reales, poner en 0 categorías sin fuente en BD
  // Indices: 0(Saldo Inicial), 5(Sin identificar), 10(Cuotas extraordinarias)
      const zeroRow = (len: number) => Array(len).fill(0)
      baseData.income[0].amounts = zeroRow(baseData.months.length)
      baseData.income[5].amounts = zeroRow(baseData.months.length)
      baseData.income[10].amounts = zeroRow(baseData.months.length)

      // Gastos: si no hay fuente real, no inventar datos -> poner en 0 todas las filas
      baseData.expenses = baseData.expenses.map((e) => ({
        ...e,
        amounts: zeroRow(baseData.months.length),
      }))

      // Recalculate totals
      baseData.summary.totalIncome = baseData.months.map((_, monthIndex) => {
        let totalIncome = 0
        baseData.income.forEach((item) => {
          if (item.amounts && item.amounts[monthIndex]) {
            totalIncome += item.amounts[monthIndex]
          }
        })
        return totalIncome
      })

      // Recalcular gastos totales a partir de las filas de gastos (quedarán 0 al no tener BD)
      baseData.summary.totalExpenses = baseData.months.map((_, monthIndex) => {
        let total = 0
        baseData.expenses.forEach((item) => {
          const v = (item as any).amounts?.[monthIndex] || 0
          total += v
        })
        return total
      })

      baseData.summary.periodBalance = baseData.months.map((_, monthIndex) => {
        return baseData.summary.totalIncome[monthIndex] - baseData.summary.totalExpenses[monthIndex]
      })

      baseData.summary.accumulatedBalance = baseData.months.map((_, monthIndex) => {
        if (monthIndex === 0) {
          return (
            initialFinancialData.summary.accumulatedBalance[0] +
            (baseData.summary.periodBalance[0] - initialFinancialData.summary.periodBalance[0])
          )
        } else {
          return baseData.summary.accumulatedBalance[monthIndex - 1] + baseData.summary.periodBalance[monthIndex]
        }
      })
    }

    return baseData
  }, [incomeByCategory, selectedCondominium, selectedYear, condoOptions])

  // Función para alternar la expansión de secciones
  const toggleSection = useCallback((section: "ingresos" | "gastos" | "saldos") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  // Funciones para manejar acciones de usuario
  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownloadPDF = useCallback(() => {
    alert("Función para descargar PDF implementada")
  }, [])

  const handleDownloadExcel = useCallback(() => {
    alert("Función para descargar Excel implementada")
  }, [])

  // Función para formatear números con separador de miles y dos decimales
  const formatCurrency = useCallback((value: number) => {
    if (value === 0) return ""
    if (!value && value !== 0) return ""

    return new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
  }).format(value)
  }, [])

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#f5f5f5]">
        <header className="bg-[#0e2c52] py-4 px-4 print:hidden">
          <div className="container mx-auto max-w-7xl">
            <Link href="/admin" className="flex items-center text-white hover:text-gray-200">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Volver al panel administrativo
            </Link>
          </div>
        </header>

        <div className="container mx-auto max-w-7xl py-6 px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 print:hidden">
            <h1 className="text-3xl font-semibold text-[#0e2c52]">Estado de Resultados</h1>

            <div className="flex flex-col sm:flex-row gap-4 md:items-center">
              <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/90 p-3 shadow-md ring-1 ring-[#0e2c52]/15">
                <Select value={selectedCondominium || (condoOptions.length ? String(condoOptions[0].id) : "no-data")} onValueChange={setSelectedCondominium}>
                  <SelectTrigger className="w-[180px] border-[#0e2c52]/30 bg-[#f8fafc] text-[#0e2c52] shadow-sm focus:ring-[#0e2c52]">
                    <SelectValue placeholder="Condominio" />
                  </SelectTrigger>
                  <SelectContent>
                    {condoOptions.length === 0 ? (
                      <SelectItem value="no-data" disabled>
                        Sin datos
                      </SelectItem>
                    ) : (
                      condoOptions.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[120px] border-[#0e2c52]/30 bg-[#f8fafc] text-[#0e2c52] shadow-sm focus:ring-[#0e2c52]">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Enero</SelectItem>
                    <SelectItem value="2">Febrero</SelectItem>
                    <SelectItem value="3">Marzo</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Mayo</SelectItem>
                    <SelectItem value="6">Junio</SelectItem>
                    <SelectItem value="7">Julio</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Septiembre</SelectItem>
                    <SelectItem value="10">Octubre</SelectItem>
                    <SelectItem value="11">Noviembre</SelectItem>
                    <SelectItem value="12">Diciembre</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px] border-[#0e2c52]/30 bg-[#f8fafc] text-[#0e2c52] shadow-sm focus:ring-[#0e2c52]">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "rounded-full border border-[#0e2c52]/25 bg-white px-5 py-2 text-sm font-semibold text-[#0e2c52] shadow-sm transition-colors hover:border-[#0a2240]/40 hover:bg-[#0e2c52]/10 hover:text-[#0a2240] focus-visible:ring-[#0e2c52]",
                    showAnnualAsSingleMonth &&
                      "border-transparent bg-[#0e2c52] text-white shadow-md hover:bg-[#0a2240] hover:text-white",
                  )}
                  onClick={() => setShowAnnualAsSingleMonth((v) => !v)}
                  title="Alterna cómo se muestran los pagos anuales"
                >
                  {showAnnualAsSingleMonth ? "Concentrar pago anual" : "Amortizar pago anual"}
                </Button>
              </div>

              <div className="flex gap-2 rounded-2xl border border-[#0e2c52]/15 bg-white/95 p-1 shadow-md">
                <Button
                  variant="outline"
                  onClick={handlePrint}
                  className="flex items-center gap-2 rounded-xl border-transparent px-4 py-2 text-sm font-semibold text-[#0e2c52] shadow-none transition-colors hover:bg-[#0e2c52]/10 hover:text-[#0a2240] focus-visible:ring-[#0e2c52]"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-2 rounded-xl border-transparent px-4 py-2 text-sm font-semibold text-[#0e2c52] shadow-none transition-colors hover:bg-[#0e2c52]/10 hover:text-[#0a2240] focus-visible:ring-[#0e2c52]"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </Button>
                <Button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 rounded-xl bg-[#0e2c52] px-5 py-2 text-sm font-semibold shadow-md hover:bg-[#0a2240] focus-visible:ring-[#0e2c52]"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Añadir después del div con className="flex flex-col md:flex-row md:items-center justify-between mb-6 print:hidden" */}
          <div className="mb-4 flex justify-end print:hidden">
            <Button
              onClick={() => setShowAllMonths(!showAllMonths)}
              variant="outline"
              className="mb-4 rounded-full border border-[#0e2c52]/25 bg-white px-5 py-2 text-sm font-semibold text-[#0e2c52] shadow-sm transition-colors hover:border-[#0a2240]/40 hover:bg-[#0e2c52]/10 hover:text-[#0a2240] focus-visible:ring-[#0e2c52]"
            >
              {showAllMonths ? "Mostrar mes seleccionado y 3 anteriores" : "Mostrar todos los meses"}
            </Button>
          </div>

          <Tabs defaultValue="table" className="print:hidden">
            <TabsList className="mb-4 bg-white/60 p-1 shadow-sm ring-1 ring-[#0e2c52]/10">
              <TabsTrigger value="table">Tabla</TabsTrigger>
              <TabsTrigger value="charts">Gráficos</TabsTrigger>
              <TabsTrigger value="summary">Resumen</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              <Card className="border-[#0e2c52]/10 bg-white/95 shadow-lg">
                <CardContent className="p-6">
                  <div className="financial-report">
                    {/* Encabezado del reporte */}
                    <div className="text-center mb-6 border-b pb-4">
                      <h2 className="text-2xl font-bold text-[#0e2c52]">{computedFinancialData.title}</h2>
                      <h3 className="text-xl font-semibold text-[#0e2c52] mt-1">{computedFinancialData.subtitle}</h3>
                      <p className="font-medium text-lg mt-1">{computedFinancialData.period}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                      {/* Columna 1: Información general */}
                      <div className="rounded-2xl border border-[#0e2c52]/10 bg-gradient-to-br from-white to-[#eaf1fb] p-4 shadow-sm">
                        <div className="flex justify-center mb-4">
                          <div className="rounded-xl bg-[#0e2c52] px-6 py-3 shadow-md">
                          <Image
                            src="/images/arcos-logo.png"
                            alt="ARC Residential Management"
                            width={180}
                            height={120}
                            className="object-contain"
                          />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Total cuotas:</span>
                            <span>{computedFinancialData.totalQuotas}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Cuota mensual:</span>
                            <span>${computedFinancialData.monthlyQuota}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Saldo actual:</span>
                            <span className="font-bold text-[#0e2c52]">
                              $
                              {formatCurrency(
                                computedFinancialData.summary.accumulatedBalance[
                                  computedFinancialData.summary.accumulatedBalance.length - 1
                                ],
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Columna 2: Resumen de ingresos y gastos */}
                      <div className="rounded-2xl border border-[#0e2c52]/10 bg-gradient-to-br from-white to-[#eaf1fb] p-4 shadow-sm">
                        <h4 className="font-bold text-lg mb-3 text-[#0e2c52]">Resumen Financiero</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Total ingresos:</span>
                            <span className="text-green-600 font-semibold">
                              $
                              {formatCurrency(
                                computedFinancialData.summary.totalIncome[
                                  computedFinancialData.summary.totalIncome.length - 1
                                ],
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Total gastos:</span>
                            <span className="text-red-600 font-semibold">
                              $
                              {formatCurrency(
                                computedFinancialData.summary.totalExpenses[
                                  computedFinancialData.summary.totalExpenses.length - 1
                                ],
                              )}
                            </span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold">Balance del periodo:</span>
                              <span
                                className={`font-bold ${computedFinancialData.summary.periodBalance[computedFinancialData.summary.periodBalance.length - 1] < 0 ? "text-red-600" : "text-green-600"}`}
                              >
                                $
                                {formatCurrency(
                                  computedFinancialData.summary.periodBalance[
                                    computedFinancialData.summary.periodBalance.length - 1
                                  ],
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Columna 3: Información bancaria */}
                      <div className="rounded-2xl border border-[#0e2c52]/10 bg-gradient-to-br from-white to-[#eaf1fb] p-4 shadow-sm">
                        <h4 className="font-bold text-lg mb-3 text-[#0e2c52]">Información Bancaria</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Saldo en bancos:</span>
                            <span>${formatCurrency(computedFinancialData.bankInfo.bankBalance)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Depósitos garantía:</span>
                            <span>${formatCurrency(computedFinancialData.bankInfo.guaranteeDeposits)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">Intereses:</span>
                            <span>${formatCurrency(computedFinancialData.bankInfo.interests)}</span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold">Balance total:</span>
                              <span className="font-bold text-[#0e2c52]">
                                ${formatCurrency(computedFinancialData.bankInfo.totalBalance)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reemplazar la sección de la tabla de morosidad y cuotas */}
                    <div className="overflow-x-auto mb-8">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <td
                              className="border border-gray-300 bg-gray-200 text-center p-2 font-semibold"
                              colSpan={visibleMonths.length + 1}
                            >
                              TOTAL DE {computedFinancialData.totalQuotas} CUOTAS ORDINARIAS
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 bg-[#0e2c52] text-white text-center p-2 font-semibold">
                              Concepto
                            </td>
                            {visibleMonths.map((month, index) => (
                              <td
                                key={`mes-${index}`}
                                className="border border-gray-300 bg-[#0e2c52] text-white text-center p-2 font-semibold"
                              >
                                {month.monthName}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-gray-300 bg-[#f0d78a] text-center p-2 font-semibold">
                              No. de Morosidad
                            </td>
                            {visibleMonthIndices.map((index) => (
                              <td
                                key={`morosidad-${index}`}
                                className="border border-gray-300 bg-[#f0d78a] text-center p-2"
                              >
                                {computedFinancialData.morosityByMonth[index]}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-gray-300 bg-[#f0d78a] text-center p-2 font-semibold">
                              Anualidades
                            </td>
                            {visibleMonthIndices.map((index) => (
                              <td
                                key={`anualidad-${index}`}
                                className="border border-gray-300 bg-[#f0d78a] text-center p-2"
                              >
                                {computedFinancialData.annualitiesByMonth[index]}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="border border-gray-300 bg-[#f0d78a] text-center p-2 font-semibold">
                              Cuotas ingresadas
                            </td>
                            {visibleMonthIndices.map((index) => (
                              <td
                                key={`cuotas-${index}`}
                                className="border border-gray-300 bg-[#f0d78a] text-center p-2"
                              >
                                {computedFinancialData.quotasByMonth[index]}
                              </td>
                            ))}
                          </tr>
                        </thead>
                      </table>
                    </div>

                    {/* Sección de INGRESOS */}
                    <div className="mb-8">
                      <div
                        className="flex justify-between items-center bg-[#0e2c52] text-white p-3 rounded-t-lg cursor-pointer"
                        onClick={() => toggleSection("ingresos")}
                      >
                        <h3 className="font-bold text-lg">INGRESOS</h3>
                        {expandedSections.ingresos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>

                      {expandedSections.ingresos && (
                        // Reemplazar la sección de la tabla de ingresos dentro de expandedSections.ingresos
                        <div className="overflow-x-auto border border-t-0 border-gray-300 rounded-b-lg">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <td className="border-b border-gray-300 p-3 font-semibold bg-gray-50">Concepto</td>
                                <td className="border-b border-gray-300 p-3 font-semibold bg-gray-50">Detalle</td>
                                {visibleMonths.map((month, index) => (
                                  <td
                                    key={`mes-ingreso-${index}`}
                                    className="border-b border-gray-300 p-3 text-right font-semibold bg-gray-50"
                                  >
                                    {month.monthName}
                                  </td>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {computedFinancialData.income.map((item, index) => (
                                <tr key={`ingreso-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="p-3 font-medium">{item.concept}</td>
                                  <td className="p-3 text-gray-600">{item.detail}</td>
                                  {visibleMonthIndices.map((monthIndex, i) => {
                                    const val = item.amounts[monthIndex] || 0
                                    const isAdvanceRow = item.concept === "CUOTAS ADELANTADAS"
                                    const advCount = metaCounts?.advanceCount?.[monthIndex] || 0
                                    const badge = isAdvanceRow && advCount >= 12
                                      ? { text: "Anual", cls: "bg-green-100 text-green-800" }
                                      : isAdvanceRow && advCount > 1
                                      ? { text: `Adelanto x${advCount}`, cls: "bg-yellow-100 text-yellow-800" }
                                      : null
                                    return (
                                      <td key={`ingreso-amt-${index}-${i}`} className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          {val > 0 ? <span>{`$${formatCurrency(val)}`}</span> : null}
                                          {badge ? (
                                            <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${badge.cls}`}>
                                              {badge.text}
                                            </span>
                                          ) : null}
                                        </div>
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                              <tr className="bg-[#0e2c52] text-white font-semibold">
                                <td className="p-3" colSpan={2}>
                                  INGRESOS TOTALES
                                </td>
                                {visibleMonthIndices.map((monthIndex, i) => (
                                  <td key={`ingreso-total-${i}`} className="p-3 text-right">
                                    ${formatCurrency(computedFinancialData.summary.totalIncome[monthIndex])}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Sección de GASTOS */}
                    <div className="mb-8">
                      <div
                        className="flex justify-between items-center bg-[#0e2c52] text-white p-3 rounded-t-lg cursor-pointer"
                        onClick={() => toggleSection("gastos")}
                      >
                        <h3 className="font-bold text-lg">GASTOS</h3>
                        {expandedSections.gastos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>

                      {expandedSections.gastos && (
                        // Reemplazar la sección de la tabla de gastos dentro de expandedSections.gastos
                        <div className="overflow-x-auto border border-t-0 border-gray-300 rounded-b-lg">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <td className="border-b border-gray-300 p-3 font-semibold bg-gray-50">Concepto</td>
                                <td className="border-b border-gray-300 p-3 font-semibold bg-gray-50">Detalle</td>
                                {visibleMonths.map((month, index) => (
                                  <td
                                    key={`mes-gasto-${index}`}
                                    className="border-b border-gray-300 p-3 text-right font-semibold bg-gray-50"
                                  >
                                    {month.monthName}
                                  </td>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {computedFinancialData.expenses.map((item, index) => (
                                <tr key={`gasto-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                  <td className="p-3 font-medium">{item.concept}</td>
                                  <td className="p-3 text-gray-600">{item.detail}</td>
                                  {visibleMonthIndices.map((monthIndex, i) => (
                                    <td key={`gasto-amt-${index}-${i}`} className="p-3 text-right">
                                      {item.amounts[monthIndex] > 0
                                        ? `$${formatCurrency(item.amounts[monthIndex])}`
                                        : ""}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              <tr className="bg-[#0e2c52] text-white font-semibold">
                                <td className="p-3" colSpan={2}>
                                  GASTOS TOTALES
                                </td>
                                {visibleMonthIndices.map((monthIndex, i) => (
                                  <td key={`gasto-total-${i}`} className="p-3 text-right">
                                    ${formatCurrency(computedFinancialData.summary.totalExpenses[monthIndex])}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Sección de SALDOS */}
                    <div className="mb-8">
                      <div
                        className="flex justify-between items-center bg-[#0e2c52] text-white p-3 rounded-t-lg cursor-pointer"
                        onClick={() => toggleSection("saldos")}
                      >
                        <h3 className="font-bold text-lg">SALDOS</h3>
                        {expandedSections.saldos ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>

                      {expandedSections.saldos && (
                        // Reemplazar la sección de la tabla de saldos dentro de expandedSections.saldos
                        <div className="overflow-x-auto border border-t-0 border-gray-300 rounded-b-lg">
                          <table className="w-full border-collapse">
                            <tbody>
                              <tr className="bg-blue-50">
                                <td className="p-3 font-semibold border-b border-gray-300" colSpan={2}>
                                  SALDO AL FINAL DEL PERIODO
                                </td>
                                {visibleMonthIndices.map((monthIndex, i) => (
                                  <td
                                    key={`balance-periodo-${i}`}
                                    className={`p-3 text-right font-semibold border-b border-gray-300 ${computedFinancialData.summary.periodBalance[monthIndex] < 0 ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {formatCurrency(computedFinancialData.summary.periodBalance[monthIndex])}
                                  </td>
                                ))}
                              </tr>
                              <tr className="bg-[#0e2c52] text-white font-semibold">
                                <td className="p-3" colSpan={2}>
                                  SALDO ACUMULADO AL FINAL DEL PERIODO
                                </td>
                                {visibleMonthIndices.map((monthIndex, i) => (
                                  <td key={`balance-acumulado-${i}`} className="p-3 text-right">
                                    ${formatCurrency(computedFinancialData.summary.accumulatedBalance[monthIndex])}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Información bancaria y cuentas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      <div className="overflow-hidden rounded-2xl border border-[#0e2c52]/15 bg-white/95 shadow-lg">
                        <h4 className="font-bold text-lg p-3 bg-[#0e2c52] text-white">
                          Información Bancaria
                        </h4>
                        <table className="w-full border-collapse">
                          <tbody>
                            <tr className="border-b border-gray-200">
                              <td className="p-3 font-semibold">Saldo en bancos</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.bankInfo.bankBalance)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <td className="p-3">Depósitos garantía</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.bankInfo.guaranteeDeposits)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-3">Intereses</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.bankInfo.interests)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <td className="p-3">Amortización anualidad</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.bankInfo.annualizedAmortization)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-3">Depósito otro costo</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.bankInfo.otherDeposit)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <td className="p-3">Dev pago de intereses</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.bankInfo.interestPayment)}
                              </td>
                            </tr>
                            <tr className="bg-gray-100 font-semibold">
                              <td className="p-3">TOTAL</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.bankInfo.totalBalance)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-[#0e2c52]/15 bg-white/95 shadow-lg">
                        <h4 className="font-bold text-lg p-3 bg-[#0e2c52] text-white">
                          Información de Cuentas
                        </h4>
                        <table className="w-full border-collapse">
                          <tbody>
                            <tr className="border-b border-gray-200">
                              <td className="p-3 font-semibold">Saldo al cierre Ago</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.accountsInfo.closingBalance)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <td className="p-3">Depósito apertura cuenta</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.accountsInfo.depositAccount)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-3">Saldo anualidades</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.accountsInfo.unavailableBalance)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50">
                              <td className="p-3">Garantías</td>
                              <td className="p-3 text-right">{computedFinancialData.accountsInfo.guarantees}</td>
                            </tr>
                            <tr className="bg-gray-100 font-semibold border-b border-gray-200">
                              <td className="p-3">TOTAL</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.accountsInfo.totalAccounts)}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="p-3 font-semibold">Bancos Ago-24</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.accountsInfo.balance2024)}
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 font-semibold">Dif Intereses de ARC</td>
                              <td className="p-3 text-right">
                                ${formatCurrency(computedFinancialData.accountsInfo.arcDifference)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts">
              <ChartsSection computedFinancialData={computedFinancialData} formatCurrency={(v) => formatCurrency(v)} />
            </TabsContent>

            <TabsContent value="summary">
              <Card className="border-[#0e2c52]/10 bg-white/95 shadow-lg">
                <CardContent className="p-6">
                  {(() => {
                    const lastVisibleIdx = (visibleMonthIndices && visibleMonthIndices.length
                      ? visibleMonthIndices[visibleMonthIndices.length - 1]
                      : computedFinancialData.months.length - 1)

                    const getIncomeAmount = (concept: string, monthIndex: number) => {
                      const row = computedFinancialData.income.find((i: any) => i.concept === concept)
                      return row ? (row.amounts?.[monthIndex] || 0) : 0
                    }

                    const maintenanceAmt = getIncomeAmount("CUOTAS DE MANTENIMIENTO INGRESADAS", lastVisibleIdx)
                    const recoveredAmt = getIncomeAmount("CUOTAS RECUPERADAS MES ANTERIOR", lastVisibleIdx)
                    const advanceAmt = getIncomeAmount("CUOTAS ADELANTADAS", lastVisibleIdx)
                    const finesAmt = getIncomeAmount("MULTAS", lastVisibleIdx)
                    const agreementsAmt = getIncomeAmount("CONVENIOS CON MOROSOS", lastVisibleIdx)
                    const commonAreasAmt = getIncomeAmount("EVENTOS EN ÁREAS", lastVisibleIdx)
                    const othersAmt = getIncomeAmount("OTROS INGRESOS", lastVisibleIdx)

                    const totalIncome = computedFinancialData.summary.totalIncome[lastVisibleIdx] || 0
                    const totalExpenses = computedFinancialData.summary.totalExpenses[lastVisibleIdx] || 0
                    const periodBalance = computedFinancialData.summary.periodBalance[lastVisibleIdx] || 0
                    const accumulated = computedFinancialData.summary.accumulatedBalance[lastVisibleIdx] || 0
                    const margin = totalIncome > 0 ? (periodBalance / totalIncome) * 100 : null
                    const healthy = periodBalance >= 0

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="rounded-2xl border border-[#0e2c52]/10 bg-gradient-to-br from-white to-[#eaf1fb] p-4 shadow-sm">
                          <h4 className="font-bold text-lg mb-3 text-[#0e2c52]">Resumen de Ingresos (mes)</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center"><span>Cuotas de mantenimiento:</span><span className="font-semibold">${formatCurrency(maintenanceAmt)}</span></div>
                            <div className="flex justify-between items-center"><span>Cuotas recuperadas:</span><span className="font-semibold">${formatCurrency(recoveredAmt)}</span></div>
                            <div className="flex justify-between items-center"><span>Cuotas adelantadas:</span><span className="font-semibold">${formatCurrency(advanceAmt)}</span></div>
                            <div className="flex justify-between items-center"><span>Multas:</span><span className="font-semibold">${formatCurrency(finesAmt)}</span></div>
                            <div className="flex justify-between items-center"><span>Convenios:</span><span className="font-semibold">${formatCurrency(agreementsAmt)}</span></div>
                            <div className="flex justify-between items-center"><span>Áreas comunes:</span><span className="font-semibold">${formatCurrency(commonAreasAmt)}</span></div>
                            <div className="flex justify-between items-center"><span>Otros ingresos:</span><span className="font-semibold">${formatCurrency(othersAmt)}</span></div>
                            <div className="border-t pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold">Total ingresos:</span>
                                <span className="font-bold text-green-600">${formatCurrency(totalIncome)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#0e2c52]/10 bg-gradient-to-br from-white to-[#eaf1fb] p-4 shadow-sm">
                          <h4 className="font-bold text-lg mb-3 text-[#0e2c52]">Resumen de Gastos (mes)</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span>Total gastos:</span>
                              <span className="font-bold text-red-600">${formatCurrency(totalExpenses)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#0e2c52]/10 bg-gradient-to-br from-white to-[#eaf1fb] p-4 shadow-sm">
                          <h4 className="font-bold text-lg mb-3 text-[#0e2c52]">Indicadores Financieros (mes)</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center"><span>Balance del periodo:</span><span className={`font-semibold ${healthy ? "text-green-600" : "text-red-600"}`}>${formatCurrency(periodBalance)}</span></div>
                            <div className="flex justify-between items-center"><span>Margen operativo:</span><span className="font-semibold">{margin === null ? "N/D" : `${margin.toFixed(1)}%`}</span></div>
                            <div className="flex justify-between items-center"><span>Reserva acumulada:</span><span className="font-semibold">${formatCurrency(accumulated)}</span></div>
                            <div className="border-t pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold">Estado:</span>
                                <span className={`font-bold ${healthy ? "text-green-600" : "text-red-600"}`}>{healthy ? "Saludable" : "Déficit"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Versión para impresión */}
          <div className="hidden print:block">
            <div className="financial-report">
              {/* Encabezado del reporte */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-[#0e2c52] rounded-md p-1 shadow-sm inline-block">
                    <Image
                      src="/images/arcos-logo.png"
                      alt="ARC Residential Management"
                      width={180}
                      height={120}
                      className="object-contain"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold">{computedFinancialData.title}</h2>
                <h3 className="text-xl font-semibold">{computedFinancialData.subtitle}</h3>
                <p className="font-medium">{computedFinancialData.period}</p>
              </div>

              {/* Tabla principal */}
              <table className="w-full border-collapse">
                {/* Encabezado con datos de morosidad */}
                <thead>
                  <tr>
                    <td className="border border-gray-300 bg-gray-400 text-center p-2 font-semibold" colSpan={9}>
                      TOTAL DE {computedFinancialData.totalQuotas} CUOTAS ORDINARIAS
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 bg-[#0e2c52] text-white text-center p-2">No. de Morosidad</td>
                    {computedFinancialData.morosityByMonth.map((value, index) => (
                      <td
                        key={`morosidad-${index}`}
                        className="border border-gray-300 bg-[#0e2c52] text-white text-center p-2"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 bg-[#0e2c52] text-white text-center p-2">Anualidades</td>
                    {computedFinancialData.annualitiesByMonth.map((value, index) => (
                      <td
                        key={`anualidad-${index}`}
                        className="border border-gray-300 bg-[#0e2c52] text-white text-center p-2"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 bg-[#0e2c52] text-white text-center p-2">
                      Cuotas ingresadas
                    </td>
                    {computedFinancialData.quotasByMonth.map((value, index) => (
                      <td
                        key={`cuotas-${index}`}
                        className="border border-gray-300 bg-[#0e2c52] text-white text-center p-2"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 text-center p-2 font-semibold">Concepto</td>
                    {computedFinancialData.months.map((month, index) => (
                      <td
                        key={`mes-${index}`}
                        className="border border-gray-300 bg-[#f0d78a] text-center p-2 font-semibold"
                      >
                        {month}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 bg-[#f0d78a] text-center p-2 font-semibold">
                      Cuota mensual ${computedFinancialData.monthlyQuota}
                    </td>
                    {Array(8)
                      .fill(null)
                      .map((_, index) => (
                        <td key={`espacio-${index}`} className="border border-gray-300"></td>
                      ))}
                  </tr>
                </thead>

                <tbody>
                  {/* Sección de INGRESOS */}
                  <tr>
                    <td colSpan={9} className="border border-gray-300 bg-gray-400 text-center p-2 font-semibold">
                      INGRESOS
                    </td>
                  </tr>

                  {computedFinancialData.income.map((item, index) => (
                    <tr key={`ingreso-${index}`}>
                      <td className="border border-gray-300 p-2 font-medium">{item.concept}</td>
                      {item.amounts.map((amount, amtIndex) => (
                        <td key={`ingreso-amt-${index}-${amtIndex}`} className="border border-gray-300 text-right p-2">
                          {amount > 0 ? `$${formatCurrency(amount)}` : ""}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Total de INGRESOS */}
                  <tr className="bg-[#0e2c52] text-white font-semibold">
                    <td className="border border-gray-300 p-2">INGRESOS TOTALES</td>
                    {computedFinancialData.summary.totalIncome.map((total, index) => (
                      <td key={`ingreso-total-${index}`} className="border border-gray-300 text-right p-2">
                        ${formatCurrency(total)}
                      </td>
                    ))}
                  </tr>

                  {/* Sección de GASTOS */}
                  <tr>
                    <td colSpan={9} className="border border-gray-300 bg-gray-400 text-center p-2 font-semibold">
                      GASTOS
                    </td>
                  </tr>

                  {computedFinancialData.expenses.map((item, index) => (
                    <tr key={`gasto-${index}`}>
                      <td className="border border-gray-300 p-2 font-medium">{item.concept}</td>
                      {item.amounts.map((amount, amtIndex) => (
                        <td key={`gasto-amt-${index}-${amtIndex}`} className="border border-gray-300 text-right p-2">
                          {amount > 0 ? `$${formatCurrency(amount)}` : ""}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Total de GASTOS */}
                  <tr className="bg-[#0e2c52] text-white font-semibold">
                    <td className="border border-gray-300 p-2">GASTOS TOTALES</td>
                    {computedFinancialData.summary.totalExpenses.map((total, index) => (
                      <td key={`gasto-total-${index}`} className="border border-gray-300 text-right p-2">
                        ${formatCurrency(total)}
                      </td>
                    ))}
                  </tr>

                  {/* Saldo al final del periodo */}
                  <tr className="bg-blue-100">
                    <td className="border border-gray-300 p-2 font-semibold">SALDO AL FINAL DEL PERIODO</td>
                    {computedFinancialData.summary.periodBalance.map((balance, index) => (
                      <td
                        key={`balance-periodo-${index}`}
                        className={`border border-gray-300 text-right p-2 font-semibold ${balance < 0 ? "text-red-600" : ""}`}
                      >
                        {formatCurrency(balance)}
                      </td>
                    ))}
                  </tr>

                  {/* Saldo acumulado */}
                  <tr className="bg-[#0e2c52] text-white font-semibold">
                    <td className="border border-gray-300 p-2">SALDO ACUMULADO AL FINAL DEL PERIODO</td>
                    {computedFinancialData.summary.accumulatedBalance.map((balance, index) => (
                      <td key={`balance-acumulado-${index}`} className="border border-gray-300 text-right p-2">
                        ${formatCurrency(balance)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* Información bancaria y cuentas */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2 font-semibold">Saldo en bancos</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.bankInfo.bankBalance)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Depósitos garantía</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.bankInfo.guaranteeDeposits)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Intereses</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.bankInfo.interests)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Amortización anualidad</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.bankInfo.annualizedAmortization)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Depósito otro costo</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.bankInfo.otherDeposit)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Dev pago de intereses</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.bankInfo.interestPayment)}
                        </td>
                      </tr>
                      <tr className="bg-gray-100 font-semibold">
                        <td className="border border-gray-300 p-2">TOTAL</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.bankInfo.totalBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2 font-semibold">Saldo al cierre Ago</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.accountsInfo.closingBalance)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Depósito apertura cuenta</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.accountsInfo.depositAccount)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Saldo anualidades</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.accountsInfo.unavailableBalance)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Garantías</td>
                        <td className="border border-gray-300 text-right p-2">
                          {computedFinancialData.accountsInfo.guarantees}
                        </td>
                      </tr>
                      <tr className="bg-gray-100 font-semibold">
                        <td className="border border-gray-300 p-2">TOTAL</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.accountsInfo.totalAccounts)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2 font-semibold">Bancos Ago-24</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.accountsInfo.balance2024)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2 font-semibold">Dif Intereses de ARC</td>
                        <td className="border border-gray-300 text-right p-2">
                          ${formatCurrency(computedFinancialData.accountsInfo.arcDifference)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}
