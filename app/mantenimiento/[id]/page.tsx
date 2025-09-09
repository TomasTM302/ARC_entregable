
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { downloadTasksPDF } from "@/lib/download-tasks-pdf"
import Image from "next/image"
import dynamic from "next/dynamic"

const MantenimientoTaskReportModal = dynamic(() => import("@/components/mantenimiento/mantenimiento-task-report-modal"), { ssr: false })

export default function CondominiumDetailPage() {
  const { id } = useParams()
  const [condo, setCondo] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Debug visual: guarda los datos crudos y errores
  const [rawCondo, setRawCondo] = useState<any>(null)
  const [rawActivities, setRawActivities] = useState<any>(null)
  const [fetchError, setFetchError] = useState<string>("")

  useEffect(() => {
    setLoading(true)
    setFetchError("")
    Promise.all([
      fetch(`/api/condominios/${id}`).then(res => res.json()),
      fetch(`/api/personal_mantenimiento/tareas?condominioId=${id}`).then(res => res.json())
    ])
      .then(([condoData, activitiesData]) => {
        setRawCondo(condoData)
        setRawActivities(activitiesData)
        setCondo(condoData.condominio)
        setActivities(activitiesData.tareas || [])
      })
      .catch((err) => {
        setFetchError(err?.message || "Error de fetch")
        setCondo(null)
        setActivities([])
      })
      .finally(() => setLoading(false))
  }, [id])

  const filteredActivities = activities.filter((act) =>
    act.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filtrar tareas de la última semana
  const lastWeekActivities = activities.filter((act) => {
    if (!act.createdAt) return false
    const fecha = new Date(act.createdAt)
    const hoy = new Date()
    const hace7dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
    return fecha >= hace7dias && fecha <= hoy
  })


  // Modal para ver fotos (solo una vez al inicio)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  if (loading) return <div className="text-center py-8">Cargando...</div>
  if (!condo) return (
    <div className="text-center py-8">
      <div>No se encontró el condominio</div>
      {fetchError && <div className="text-red-500">Error: {fetchError}</div>}
      <details className="mt-4 text-xs text-gray-500">
        <summary>Debug datos crudos</summary>
        <pre>{JSON.stringify({ rawCondo, rawActivities }, null, 2)}</pre>
      </details>
    </div>
  )


  // Convierte cualquier formato de enlace de Drive a /file/d/{id}/preview
  const toDrivePreview = (url: string): string | null => {
    try {
      const m1 = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
      if (m1?.[1]) return `https://drive.google.com/file/d/${m1[1]}/preview`
      const m2 = url.match(/[?&]id=([\w-]+)/)
      if (m2?.[1]) return `https://drive.google.com/file/d/${m2[1]}/preview`
      return null
    } catch {
      return null
    }
  }

  const openModal = (task: any) => {
    setSelectedTask(task)
    setShowModal(true)
  }
  const closeModal = () => {
    setShowModal(false)
    setSelectedTask(null)
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold text-black text-center">{condo.nombre}</h1>
        <p className="text-center text-gray-500 mb-4">{condo.direccion}</p>
        <div className="flex gap-2 mb-2">
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
            onClick={() => setReportOpen(true)}
          >
            Reporte Mantenimiento (con imágenes)
          </button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Buscar tareas..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron tareas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredActivities.map((act) => (
              <Card key={act.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full" onClick={() => openModal(act)}>
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold">{act.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">{act.description}</p>
                  <span className="text-xs text-gray-500">{act.status}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de fotos de la tarea */}
        <Dialog open={showModal} onOpenChange={closeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Fotos de la tarea</DialogTitle>
            </DialogHeader>
            {selectedTask?.evidenceUrl ? (
              <div className="flex flex-wrap items-center gap-4 justify-center">
                {(() => {
                  const urls = Array.isArray(selectedTask.evidenceUrl)
                    ? selectedTask.evidenceUrl
                    : typeof selectedTask.evidenceUrl === 'string' && selectedTask.evidenceUrl.includes(',')
                      ? selectedTask.evidenceUrl.split(',').map((s: string) => s.trim())
                      : selectedTask.evidenceUrl ? [selectedTask.evidenceUrl] : []
                  return urls.map((raw: string, idx: number) => {
                    const url = raw.trim()
                    const isDrive = /drive\.google\.com/.test(url)
                    const iframeUrl = isDrive ? (toDrivePreview(url) || url) : ''
                    return (
                      <div key={idx} className="w-[320px] h-[240px] bg-black/5 rounded flex items-center justify-center overflow-hidden">
                        {isDrive ? (
                          <iframe src={iframeUrl} className="w-full h-full border-0" />
                        ) : (
                          /^(https?:)?\/\//.test(url) ? (
                            <img src={url} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-gray-500 p-2">URL no válida</span>
                          )
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            ) : (
              <div className="text-center text-gray-500">No hay imágenes para esta tarea.</div>
            )}
          </DialogContent>
        </Dialog>

  <MantenimientoTaskReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} condominioId={String(id)} />
      </div>
    </div>
  )
}
