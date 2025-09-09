"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Download, Filter } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const MantenimientoTaskReportModal = dynamic(() => Promise.resolve(MantenimientoTaskReportModalComponent), { ssr: false })

export default MantenimientoTaskReportModal

interface Props {
  isOpen: boolean
  onClose: () => void
  condominioId?: string | number
}

type Task = {
  id: string | number
  title: string
  description?: string
  status: "pending" | "in-progress" | "completed" | string
  priority?: string
  assignedTo?: string | number
  createdAt?: string
  completedAt?: string | null
  evidenceUrl?: string | string[] | null
}

function MantenimientoTaskReportModalComponent({ isOpen, onClose, condominioId }: Props) {
  const [auxiliares, setAuxiliares] = useState<Array<{ id: string | number; nombre: string }>>([])
  const [selectedAux, setSelectedAux] = useState<string | "all">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [rawTasks, setRawTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [isAuxMenuOpen, setIsAuxMenuOpen] = useState(false)

  // Cargar tareas de mantenimiento y (si hay) lista de auxiliares básica desde las tareas
  useEffect(() => {
    if (!isOpen) return
    // Forzar última semana en los filtros de fecha
    const toYYYYMMDD = (d: Date) => {
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      return local.toISOString().slice(0, 10)
    }
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const uiEnd = toYYYYMMDD(today)
  setStartDate(toYYYYMMDD(weekAgo))
  setEndDate(uiEnd)
    setLoading(true)
    const params = new URLSearchParams()
    if (condominioId) params.set("condominioId", String(condominioId))
    params.set("start", toYYYYMMDD(weekAgo))
    params.set("end", uiEnd)
    fetch(`/api/personal_mantenimiento/tareas?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const tareas: Task[] = Array.isArray(data?.tareas) ? data.tareas : []
        setRawTasks(tareas)
        const uniqueAux = new Map<string, { id: string; nombre: string }>()
        tareas.forEach((t: any) => {
          const id = t.assignedTo ?? t.auxiliar_id
          if (id != null) {
            uniqueAux.set(String(id), { id: String(id), nombre: `Auxiliar ${id}` })
          }
        })
        setAuxiliares(Array.from(uniqueAux.values()))
      })
      .catch(() => setRawTasks([]))
      .finally(() => setLoading(false))
  }, [isOpen, condominioId])

  // Helpers
  const parseEvidence = (e?: string | string[] | null): string[] => {
    if (!e) return []
    if (Array.isArray(e)) return e.filter(Boolean)
    if (typeof e === "string" && e.includes(",")) return e.split(",").map((s) => s.trim()).filter(Boolean)
    return typeof e === "string" ? [e] : []
  }

  const toDateStr = (s?: string | null) => (s ? format(new Date(s), "dd MMM yyyy", { locale: es }) : "")

  function getTaskFilterDate(t: Task): number | undefined {
    const pick = t.createdAt || (t as any).updatedAt || t.completedAt || null
    return pick ? new Date(pick).getTime() : undefined
  }

  const filtered = useMemo(() => {
    let arr = [...rawTasks]
    if (selectedAux !== "all") arr = arr.filter((t) => String(t.assignedTo ?? "") === String(selectedAux))
    return arr
  }, [rawTasks, selectedAux])

  async function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(String(r.result))
      r.onerror = reject
      r.readAsDataURL(blob)
    })
  }

  function extractDriveId(url: string): string | null {
    try {
      const mUc = url.match(/[?&]id=([\w-]+)/)
      if (mUc?.[1]) return mUc[1]
      const mFile = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/)
      if (mFile?.[1]) return mFile[1]
      return null
    } catch { return null }
  }

  async function tryFetchImageData(url: string): Promise<string | null> {
    try {
      // Intentar vía proxy con fileId si es Drive; si no, proxy genérico
      const fileId = extractDriveId(url)
      const target = fileId
        ? `/api/drive/fetch?id=${encodeURIComponent(fileId)}`
        : `/api/drive/fetch?src=${encodeURIComponent(url)}`
      const controller = new AbortController()
      const timer: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(target, { signal: controller.signal as any })
      clearTimeout(timer)
      if (!res.ok) return null
      const blob = await res.blob()
      if (blob.type && blob.type.includes("text/html")) return null
      return await blobToDataUrl(blob)
    } catch {
      return null
    }
  }

  async function getImageNaturalSize(dataUrl: string): Promise<{ w: number; h: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height })
      img.onerror = (e) => reject(e)
      img.src = dataUrl
    })
  }

  const exportToPDF = async () => {
    setIsGenerating(true)
    try {
      const jsPDFModule: any = await import("jspdf")
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default
      const autoTableModule: any = await import("jspdf-autotable")
      const autoTable = autoTableModule.default || autoTableModule

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      // Header
      doc.setFillColor(13, 44, 82)
      doc.rect(0, 0, 210, 25, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.text("REPORTE DE TAREAS DE MANTENIMIENTO", 105, 15, { align: "center" })
      doc.setFontSize(10)
      doc.text("CONFIDENCIAL", 105, 22, { align: "center" })

      // Watermark
      doc.setTextColor(230, 230, 230)
      doc.setFontSize(60)
      doc.text("CONFIDENCIAL", 105, 150, { align: "center", angle: 45 })

      // Info
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString("es-MX")}`, 14, 35)
      doc.text(`Período: ${startDate || "Inicio"} - ${endDate || "Actual"}`, 14, 43)
      doc.text(`Auxiliar: ${selectedAux === "all" ? "Todos" : `ID ${selectedAux}`}`, 14, 51)
      if (condominioId) doc.text(`Condominio: ${condominioId}`, 14, 59)

      let yPos = 66

      // Resumen (solo total de tareas)
      const total = filtered.length
      ;(autoTable as any)(doc as any, {
        startY: yPos,
        head: [["Total Tareas"]],
        body: [[total]],
        theme: "grid",
        headStyles: { fillColor: [13, 44, 82], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        bodyStyles: { halign: "center", fontStyle: "bold" },
        columnStyles: { 0: { fillColor: [240, 240, 250] } },
      })

      yPos = (doc as any).lastAutoTable.finalY + 8

      // Tabla de tareas
      const rows = filtered.map((t) => {
        const pick = t.createdAt || (t as any).updatedAt || t.completedAt || null
        return [t.title || "(Sin título)", toDateStr(pick), t.status === "completed" ? "Completada" : t.status === "in-progress" ? "En progreso" : "Pendiente"]
      }) as any
      ;(autoTable as any)(doc as any, {
        startY: yPos,
        head: [["Título", "Asignada", "Estado"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [13, 44, 82], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 255] },
      })
      yPos = (doc as any).lastAutoTable.finalY + 8

      // Evidencias por tarea (todas las imágenes disponibles)
      for (const t of filtered) {
        const urls = parseEvidence(t.evidenceUrl)
        if (!urls.length) continue
        if (yPos > 250) { doc.addPage(); yPos = 20 }
        doc.setFontSize(11)
        doc.setTextColor(13, 44, 82)
        doc.text(`Evidencias: ${t.title || "(Sin título)"}`, 14, yPos)
        yPos += 4
        for (const u of urls) {
          const imgData = await tryFetchImageData(u)
          if (imgData) {
            const maxW = 182
            const maxH = 100
            let drawW = maxW
            let drawH = 60
            try {
              const { w, h } = await getImageNaturalSize(imgData)
              if (w > 0 && h > 0) {
                const scale = Math.min(maxW / w, maxH / h)
                drawW = Math.max(10, Math.round(w * scale))
                drawH = Math.max(10, Math.round(h * scale))
              }
            } catch {}
            if (yPos + drawH > 285) { doc.addPage(); yPos = 20 }
            const fmt = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG'
            doc.addImage(imgData, fmt as any, 14, yPos, drawW, drawH, undefined, 'FAST')
            yPos += drawH + 4
          } else {
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(10)
            doc.text(`Evidencia (no embebible): ${u}`, 14, yPos)
            yPos += 6
          }
        }
        yPos += 2
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setDrawColor(13, 44, 82, 0.5)
        doc.setLineWidth(0.5)
        doc.line(14, 280, 196, 280)
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text("Este documento contiene información confidencial y es para uso exclusivo del personal autorizado.", 105, 286, { align: "center" })
        doc.text(`Página ${i} de ${pageCount}`, 196, 286, { align: "right" })
      }

      const dateStr = new Date().toISOString().split("T")[0]
      const timeStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-")
      doc.save(`reporte-tareas-mantenimiento_${dateStr}_${timeStr}.pdf`)
    } catch (e) {
      console.error("Error generando PDF de mantenimiento:", e)
      alert("Error al generar el PDF de mantenimiento.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold">Reporte de Tareas de Mantenimiento</DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Label className="block mb-2">Auxiliar</Label>
            <div className="relative">
              <Button
                variant="outline"
                className="w-full flex items-center justify-between bg-gray-200 text-black hover:bg-gray-300"
                onClick={() => setIsAuxMenuOpen(!isAuxMenuOpen)}
              >
                <div className="flex items-center"><Filter className="h-4 w-4 mr-2" />{selectedAux === "all" ? "Todos" : `ID ${selectedAux}`}</div>
              </Button>
              <div className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-10" style={{ display: isAuxMenuOpen ? "block" : "none" }}>
                <div className="py-1 max-h-60 overflow-y-auto">
                  <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { setSelectedAux("all"); setIsAuxMenuOpen(false) }}>Todos</button>
                  {auxiliares.map((a) => (
                    <button key={String(a.id)} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => { setSelectedAux(String(a.id)); setIsAuxMenuOpen(false) }}>{a.nombre}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <Label className="block mb-2">Fecha inicio (última semana)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="date" className="pl-10" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled />
            </div>
          </div>
          <div>
            <Label className="block mb-2">Fecha fin (hoy)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="date" className="pl-10" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled />
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 flex justify-end">
          <Button onClick={exportToPDF} disabled={isGenerating || loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4 mr-2" /> {isGenerating ? "Generando..." : "Generar PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
