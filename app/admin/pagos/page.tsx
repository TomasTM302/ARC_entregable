"use client"

import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"

type GeneralPayment = {
  id: string
  userId: string
  userName: string
  referenceId: string | null
  type: string | null
  amount: number
  paymentDate: string | null
  method: string | null
  status: string | null
  notes: string | null
}

export default function AdminPaymentsPage() {
  // Vistas deseadas: verificación (procesando) y completado. Solo transferencias.
  const [sectionView, setSectionView] = useState<"verification" | "completed">("verification")

  const [verificationPayments, setVerificationPayments] = useState<GeneralPayment[]>([])
  const [completedPayments, setCompletedPayments] = useState<GeneralPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const isVerificationStatus = (s?: string | null) => {
    const t = String(s ?? '').toLowerCase()
    return t === 'procesando' || t === 'pendiente'
  }
  const isCompletedStatus = (s?: string | null) => {
    const t = String(s ?? '').toLowerCase()
    return t === 'completado' || t === 'aprobado' || t === 'confirmado' || t === 'pagado'
  }
  const statusBadge = (s?: string | null) => {
    const t = String(s ?? '').toLowerCase()
    if (isCompletedStatus(t)) return { label: 'completado', cls: 'bg-green-100 text-green-800' }
    if (t === 'rechazado') return { label: 'rechazado', cls: 'bg-red-100 text-red-800' }
    return { label: t || '—', cls: 'bg-yellow-100 text-yellow-800' }
  }

  function bucketize(pagos: GeneralPayment[]) {
    setVerificationPayments(pagos.filter(p => isVerificationStatus(p.status)))
    // ordenar completados por fecha_pago desc si existe
    const completed = pagos.filter(p => isCompletedStatus(p.status)).sort((a, b) => {
      const ta = a.paymentDate ? new Date(a.paymentDate).getTime() : 0
      const tb = b.paymentDate ? new Date(b.paymentDate).getTime() : 0
      return tb - ta
    })
    setCompletedPayments(completed)
  }

  async function loadAll() {
    setLoading(true)
    try {
      const res = await fetch('/api/pagos/general?metodo=transferencia', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      const pagos: GeneralPayment[] = Array.isArray(data?.pagos) ? data.pagos : []
      bucketize(pagos)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Cargar solo cuando se cambia de pestaña o en el primer render
    loadAll()
    // sin intervalos; el refresh ocurrirá tras acciones o al cambiar sectionView
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionView])

  const renderTable = (items: GeneralPayment[], showActions: boolean) => (
    <div className="bg-black rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Residente</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Referencia</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Tipo</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Método</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Fecha</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Monto</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Estado</th>
              {showActions && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.length ? (
              items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-gray-900">{p.userName || p.userId}</td>
                  <td className="px-3 py-3 text-sm font-mono text-gray-900">{p.referenceId || "—"}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">{p.type || "—"}</td>
                  <td className="px-3 py-3 text-sm capitalize text-gray-900">{p.method || "—"}</td>
                  <td className="px-3 py-3 text-sm text-gray-900">{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : "—"}</td>
                  <td className="px-3 py-3 text-sm font-semibold text-gray-900">${p.amount.toLocaleString()}</td>
                  <td className="px-3 py-3 text-xs">
                    {(() => { const b = statusBadge(p.status); return (
                      <span className={`px-2 py-1 rounded-full ${b.cls}`}>{b.label}</span>
                    ) })()}
                  </td>
                  {showActions && (
                    <td className="px-3 py-3 text-sm">
                      <div className="flex items-center gap-2">
        <button
                          onClick={async () => {
                            if (actionLoadingId) return
                            setActionLoadingId(p.id)
                            try {
                              const res = await fetch(`/api/pagos/general/${p.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ accion: 'aprobar' })
                              })
                              const data = await res.json().catch(() => ({}))
                              if (!res.ok || !data?.success) throw new Error(data?.message || 'No se pudo aprobar el pago')
                              const nowIso = new Date().toISOString()
                              setVerificationPayments(prev => prev.filter(x => x.id !== p.id))
                              // Mover optimistamente a "Completado" (por si el fetch tarda)
                              setCompletedPayments(prev => [{ ...p, status: 'completado', paymentDate: nowIso }, ...prev])
          toast({ title: 'Pago aprobado', description: `Se aprobó la transferencia ${p.referenceId ?? ''}` })
                              // Refrescar datos desde el servidor (una sola consulta)
                              await loadAll()
                            } catch (err: any) {
                              toast({ title: 'Error', description: err?.message || 'No se pudo aprobar', })
                            } finally {
                              setActionLoadingId(null)
                            }
                          }}
                          disabled={!!actionLoadingId}
                          aria-busy={actionLoadingId === p.id}
                          className={`px-2 py-1 bg-green-600 text-white rounded text-xs ${actionLoadingId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
                        >{actionLoadingId === p.id ? 'Aprobando…' : 'Aprobar'}</button>
        <button
                          onClick={async () => {
                            if (actionLoadingId) return
                            setActionLoadingId(p.id)
                            try {
                              const res = await fetch(`/api/pagos/general/${p.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ accion: 'rechazar' })
                              })
                              const data = await res.json().catch(() => ({}))
                              if (!res.ok || !data?.success) throw new Error(data?.message || 'No se pudo rechazar el pago')
                              setVerificationPayments(prev => prev.filter(x => x.id !== p.id))
                              toast({ title: 'Pago rechazado', description: `Se rechazó la transferencia ${p.referenceId ?? ''}` })
                              await loadAll()
                            } catch (err: any) {
                              toast({ title: 'Error', description: err?.message || 'No se pudo rechazar', })
                            } finally {
                              setActionLoadingId(null)
                            }
                          }}
                          disabled={!!actionLoadingId}
                          aria-busy={actionLoadingId === p.id}
                          className={`px-2 py-1 bg-red-600 text-white rounded text-xs ${actionLoadingId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                        >{actionLoadingId === p.id ? 'Rechazando…' : 'Rechazar'}</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr><td className="px-3 py-6 text-sm text-gray-500" colSpan={showActions ? 8 : 7}>No hay registros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setSectionView('verification')} className={`px-3 py-1 rounded-md text-sm transition-colors text-black ${sectionView === 'verification' ? 'bg-white shadow-sm' : ''}`}>Verificación</button>
          <button onClick={() => setSectionView('completed')} className={`px-3 py-1 rounded-md text-sm transition-colors text-black ${sectionView === 'completed' ? 'bg-white shadow-sm' : ''}`}>Completado</button>
        </div>
  <div className="text-sm text-white">
          {loading ? 'Cargando…' : sectionView === 'verification' ? `${verificationPayments.length} en verificación` : `${completedPayments.length} completados`}
        </div>
      </div>

      {sectionView === 'verification' && renderTable(verificationPayments, true)}
      {sectionView === 'completed' && renderTable(completedPayments, false)}
    </div>
  )
}
