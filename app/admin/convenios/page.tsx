"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, FileText, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthGuard from "@/components/auth-guard"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import NewPaymentAgreementModal from "@/components/new-payment-agreement-modal"

// Tipos para los convenios
interface PaymentDetail {
  id: string
  description: string
  amount: number
  paymentDate: string
  status: "pending" | "paid" | "late"
}

interface Agreement {
  id: string
  userId: string
  userName: string
  userHouse: string
  createdAt: string
  totalAmount: number
  payments: PaymentDetail[]
}

// Inicia vacío, se cargará desde la API
const mockAgreements: Agreement[] = []

export default function ConveniosPage() {
  const [agreements, setAgreements] = useState<Agreement[]>(mockAgreements)
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewAgreementModalOpen, setIsNewAgreementModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar desde API SQL
  const loadAgreements = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/convenios")
      const data = await res.json()
      if (data?.success && Array.isArray(data.convenios)) {
        // Nota: por ahora no hay tabla de pagos parciales; dejamos payments como []
        const base = data.convenios.map((c: any) => ({
          id: String(c.id),
          userId: String(c.usuario_id || c.userId || ""),
          userName: String(c.userName || ""),
          userHouse: String(c.userHouse || ""),
          createdAt: c.fecha_creacion || c.createdAt,
          totalAmount: Number(c.monto_total ?? c.totalAmount ?? 0),
          payments: [] as PaymentDetail[],
        }))

        // Cargar pagos por convenio en paralelo controlado
        const results = await Promise.all(
          base.map(async (ag: Agreement) => {
            try {
              const r = await fetch(`/api/convenios/${ag.id}/pagos`)
              const d = await r.json()
              if (d?.success && Array.isArray(d.pagos)) {
                const pays: PaymentDetail[] = d.pagos.map((p: any) => ({
                  id: String(p.id),
                  description: `Pago ${p.numeroPago}`,
                  amount: Number(p.monto ?? 0),
                  paymentDate: p.fechaVencimiento,
                  status: p.estado === 'pagado' ? 'paid' : (p.estado === 'atrasado' ? 'late' : 'pending'),
                }))
                return { ...ag, payments: pays }
              }
            } catch {}
            return ag
          })
        )

        setAgreements(results)
      } else {
        setAgreements([])
      }
    } catch (e) {
      setError("No se pudieron cargar los convenios")
      setAgreements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAgreements() }, [])

  // Filtrar convenios por término de búsqueda
  const filteredAgreements = useMemo(() => agreements.filter(
    (agreement) =>
      agreement.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.userHouse.toLowerCase().includes(searchTerm.toLowerCase()),
  ), [agreements, searchTerm])

  // Función para obtener el color de estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "late":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Función para obtener el texto de estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pagado"
      case "pending":
        return "Pendiente"
      case "late":
        return "Atrasado"
      default:
        return "Desconocido"
    }
  }

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <section className="container mx-auto flex-1 flex flex-col items-start justify-start py-6 px-4">
          <div className="w-full mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Convenios de Pago</h1>
              <p className="text-gray-300 mt-2">Gestiona los acuerdos de pago con los residentes.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                className="bg-[#d6b15e] hover:bg-[#c4a14e] text-[#0e2c52]"
                onClick={() => setIsNewAgreementModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Convenio
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md w-full max-w-6xl mx-auto">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Buscar por nombre o casa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando…</div>
            ) : filteredAgreements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>{error || "No se encontraron convenios de pago."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Residente</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Casa</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Fecha de creación</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Monto total</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Pagos</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Estado</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAgreements.map((agreement) => {
                      // Calcular el estado general del convenio
                      const paidCount = agreement.payments.filter((p) => p.status === "paid").length
                      const lateCount = agreement.payments.filter((p) => p.status === "late").length
                      let status = "pending"
                      if (paidCount === agreement.payments.length) {
                        status = "paid"
                      } else if (lateCount > 0) {
                        status = "late"
                      }

                      return (
                        <tr key={agreement.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-800">{agreement.userName}</td>
                          <td className="py-3 px-4 text-sm text-gray-800">{agreement.userHouse}</td>
                          <td className="py-3 px-4 text-sm text-gray-800">
                            {format(new Date(agreement.createdAt), "d MMM yyyy", { locale: es })}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-800">
                            ${agreement.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-800">
                            {paidCount}/{agreement.payments.length}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
                              {getStatusText(status)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex justify-center">
                              <button
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Editar"
                                onClick={() => alert(`Editar convenio ${agreement.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Modal para nuevo convenio */}
        <NewPaymentAgreementModal
          isOpen={isNewAgreementModalOpen}
          onClose={() => setIsNewAgreementModalOpen(false)}
          onCreated={() => {
            // reload from API after creating
            ;(async () => { await loadAgreements() })()
          }}
        />
      </main>
    </AuthGuard>
  )
}
