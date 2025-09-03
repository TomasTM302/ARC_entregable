"use client"

import { useState, useEffect } from "react"
import { Plus, AlertCircle, XCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthGuard from "@/components/auth-guard"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import NewFineModal from "@/components/new-fine-modal"



export default function MultasPage() {
  const [fines, setFines] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isNewFineModalOpen, setIsNewFineModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // Obtener multas desde la API
  const fetchFines = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/multas?month=${selectedMonth}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setFines(data.multas)
      } else {
        setError(data.message || "Error al obtener multas")
      }
    } catch {
      setError("Error al obtener multas")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchFines()
  }, [selectedMonth])

  // Filtrar multas por término de búsqueda
  const filteredFines = fines.filter(
    (fine) =>
      (fine.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fine.userHouse || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fine.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función para cancelar una multa
  const cancelFine = async (id: string) => {
    // Primera confirmación
    if (!confirm("¿Estás seguro de que deseas iniciar la cancelación de esta multa?")) return
    // Solicitar comentario
    const comentario = prompt("Ingresa un comentario / motivo de cancelación (obligatorio):")
    if (comentario === null) return // usuario canceló prompt
    if (!comentario.trim()) {
      alert("El comentario es obligatorio para cancelar la multa.")
      return
    }
    // Segunda confirmación
    if (!confirm("Confirmar definitivamente la cancelación. Esta acción no se puede deshacer.")) return
    try {
      const res = await fetch(`/api/multas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: "cancelada", comentario }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        fetchFines()
      } else {
        alert(data.message || "Error al cancelar la multa")
      }
    } catch {
      alert("Error al cancelar la multa")
    }
  }

  // Función para editar una multa
  const editFine = (id: string) => {
    alert(`Editar multa ${id} - Esta funcionalidad se implementará próximamente`)
  }

  // Función para obtener el color de estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagada':
        return 'bg-green-100 text-green-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelada':
        return 'bg-gray-200 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pagada':
        return 'Pagada'
      case 'pendiente':
        return 'Pendiente'
      case 'cancelada':
        return 'Cancelada'
      default:
        return status
    }
  }

  // Función para obtener el icono de estado
  // Iconos antiguos removidos (estados ahora: pendiente, pagada, cancelada)

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <section className="container mx-auto flex-1 flex flex-col items-start justify-start py-6 px-4">
          <div className="w-full mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Gestión de Multas</h1>
              <p className="text-gray-300 mt-2">Crea y administra las multas aplicadas a los residentes.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                className="bg-[#d6b15e] hover:bg-[#c4a14e] text-[#0e2c52]"
                onClick={() => setIsNewFineModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Multa
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md w-full max-w-6xl mx-auto">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, casa o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b6dc7] text-gray-800"
              />
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Cargando multas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>{error}</p>
              </div>
            ) : filteredFines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No hay multas registradas en el mes seleccionado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Residente</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Casa</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Motivo</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Monto</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Vencimiento</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Estado</th>
                      <th className="py-3 px-4 text-center text-sm font-medium text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredFines.map((fine) => (
                      <tr key={fine.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-800">{fine.userName || "-"}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">{fine.userHouse || "-"}</td>
                        <td className="py-3 px-4 text-sm text-gray-800">
                          <div className="max-w-xs truncate text-gray-800" title={fine.reason}>
                            {fine.reason}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {fine.status === 'overdue' ? (
                            <div>
                              <span className="line-through text-gray-500">${Number(fine?.amount ?? fine?.monto ?? 0).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-gray-800">${Number(fine?.amount ?? fine?.monto ?? 0).toLocaleString()}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-800">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                            <span>
                              {(() => {
                                const raw = fine?.dueDate ?? fine?.fecha_vencimiento
                                if (!raw) return "-"
                                const d = new Date(raw)
                                if (isNaN(d.getTime())) return "-"
                                try {
                                  return format(d, 'd MMM yyyy', { locale: es })
                                } catch {
                                  return "-"
                                }
                              })()}
                            </span>
                          </div>
                          {/* Estado 'overdue' removido en nuevo modelo (pendiente/pagada/cancelada) */}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs flex items-center w-fit ${getStatusColor(fine.status)}`}>
                            {getStatusText(fine.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {fine.status === "pendiente" ? (
                            <div className="flex items-center justify-center space-x-3">
                              <button
                                className="text-red-600 hover:text-red-800"
                                title="Cancelar multa"
                                onClick={() => cancelFine(fine.id)}
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-gray-400 text-xs">-</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Modal para nueva multa */}
        <NewFineModal isOpen={isNewFineModalOpen} onClose={() => setIsNewFineModalOpen(false)} />
      </main>
    </AuthGuard>
  )
}
