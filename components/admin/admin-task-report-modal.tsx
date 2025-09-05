"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type AdminTaskReport } from "@/lib/admin-tasks-store"
import { useAuthStore } from "@/lib/auth"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FileText, Filter, Calendar, Download } from "lucide-react"
import dynamic from "next/dynamic"

const AdminTaskReportModal = dynamic(() => Promise.resolve(AdminTaskReportModalComponent), { ssr: false })

interface AdminTaskReportModalProps {
  isOpen: boolean
  onClose: () => void
}

function AdminTaskReportModalComponent({ isOpen, onClose }: AdminTaskReportModalProps) {
  const { users } = useAuthStore()
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [rawTasks, setRawTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Obtener solo usuarios administrativos
  const adminUsers = users.filter((user) => user.role === "admin")

  // Función para formatear la fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha"
    return format(new Date(dateString), "dd MMM yyyy", { locale: es })
  }

  // Función para obtener el nombre del usuario
  const getUserName = (userId: string) => {
    const user = users.find((u) => String(u.id) === String(userId))
    return user ? `${user.firstName} ${user.lastName}` : "Usuario desconocido"
  }

  // Actualizar la función exportToPDF para mejorar el formato y estructura del PDF
  // basado en la versión 67 que funcionaba correctamente

  const exportToPDF = async () => {
    setIsGenerating(true)

    try {
  // Importaciones robustas para jsPDF y autotable
  const jsPDFModule: any = await import("jspdf")
  const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default
  const autoTableModule: any = await import("jspdf-autotable")
  const autoTable = autoTableModule.default || autoTableModule

      // Create new document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Add header with logo
      doc.setFillColor(13, 44, 82) // Color corporativo
      doc.rect(0, 0, 210, 25, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.text("REPORTE DE TAREAS ADMINISTRATIVAS", 105, 15, { align: "center" })
      doc.setFontSize(10)
      doc.text("CONFIDENCIAL", 105, 22, { align: "center" })

      // Intentar agregar logo si está disponible (se prueban varias rutas conocidas)
      {
    const tryAddLogo = async (paths: string[]) => {
          for (const p of paths) {
            try {
              const canvas = document.createElement("canvas")
              const ctx = canvas.getContext("2d")
              const img = new Image()
              img.crossOrigin = "Anonymous"
              await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
                img.src = p
              })
              canvas.width = img.width
              canvas.height = img.height
              ctx?.drawImage(img, 0, 0)
              const logoData = canvas.toDataURL("image/png")
              // Fondo azul detrás del logo
              doc.setFillColor(14, 44, 82)
      doc.roundedRect(8, 4, 22, 18, 2, 2, "F")
      doc.addImage(logoData, "PNG", 10, 5, 18, 15)
              return true
            } catch (_) {
              // continuar con el siguiente path
            }
          }
          return false
        }
        await tryAddLogo(["/logo-monet.png", "/placeholder-logo.png"]) // silencioso si falla
      }

      // Add watermark
      doc.setTextColor(230, 230, 230)
      doc.setFontSize(60)
      doc.text("CONFIDENCIAL", 105, 150, { align: "center", angle: 45 })

      // Restore color for content
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)

      // Add report information
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString("es-MX")}`, 14, 35)
      doc.text(`Período: ${startDate || "Inicio"} - ${endDate || "Actual"}`, 14, 43)
      doc.text(`Usuario: ${selectedUser === "all" ? "Todos" : getUserName(selectedUser)}`, 14, 51)

      // Generate tables for each user
      let yPos = 60

  // Usar reportes ya calculados
  const reports: AdminTaskReport[] = computedReports

      // Si no hay reportes, mostrar mensaje
      if (reports.length === 0) {
        doc.setFontSize(14)
        doc.setTextColor(100, 100, 100)
        doc.text("No se encontraron datos para los criterios seleccionados", 105, 100, { align: "center" })

        // Add footer with confidentiality information
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(
          "Este documento contiene información confidencial y es para uso exclusivo del personal autorizado.",
          105,
          285,
          { align: "center" },
        )
        doc.text(`Página 1 de 1`, 105, 290, { align: "center" })

        // Save PDF
        const dateStr = new Date().toISOString().split("T")[0]
        const timeStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-")
        doc.save(`reporte-tareas-administrativas_${dateStr}_${timeStr}.pdf`)
        setIsGenerating(false)
        return
      }

      // Procesar cada reporte de usuario
      reports.forEach((report) => {
        // Verificar si hay suficiente espacio para el reporte completo
        // Si no hay suficiente espacio, agregar nueva página
        if (yPos > 220) {
          doc.addPage()
          yPos = 20
        }

  // Encabezado del reporte de usuario (fondo azul y texto blanco)
  doc.setFillColor(13, 44, 82)
  doc.rect(14, yPos, 182, 10, "F")
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text(`Reporte de: ${getUserName(report.userId)}`, 17, yPos + 7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)
        yPos += 15

    // Summary table con estilos mejorados
    ;(autoTable as any)(doc as any, {
          startY: yPos,
          head: [["Total Tareas", "Completadas", "Pendientes", "En Progreso", "Tiempo Promedio"]],
          body: [
            [
              report.totalTasks,
              report.completedTasks,
              report.pendingTasks,
              report.inProgressTasks,
              report.averageCompletionTime ? `${report.averageCompletionTime.toFixed(2)} días` : "N/A",
            ],
          ],
          theme: "grid",
          headStyles: {
            fillColor: [13, 44, 82],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
          },
          bodyStyles: {
            halign: "center",
            fontStyle: "bold",
          },
          columnStyles: {
            0: { fillColor: [240, 240, 250] },
            1: { fillColor: [230, 255, 230] },
            2: { fillColor: [255, 245, 230] },
            3: { fillColor: [230, 240, 255] },
            4: { fillColor: [240, 240, 240] },
          },
        })

        // Get the final Y position after the table
        yPos = (doc as any).lastAutoTable.finalY + 10

        // Tasks table con estilos mejorados
        const tableRows = report.tasks.map((task) => [
          task.title,
          formatDate(task.assignedAt),
          task.completedAt ? formatDate(task.completedAt) : "Pendiente",
          task.status === "completed" ? "Completada" : task.status === "in-progress" ? "En progreso" : "Pendiente",
          task.timeToComplete ? `${task.timeToComplete.toFixed(2)} días` : "N/A",
        ])
  ;(autoTable as any)(doc as any, {
          startY: yPos,
          head: [["Título", "Asignada", "Completada", "Estado", "Tiempo"]],
          body: tableRows,
          theme: "striped",
          headStyles: {
            fillColor: [13, 44, 82],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [245, 245, 255],
          },
          columnStyles: {
            3: {
              fontStyle: "bold",
              didParseCell: (data: any) => {
                if (data.cell.text[0] === "Completada") {
                  data.cell.styles.textColor = [0, 150, 0]
                } else if (data.cell.text[0] === "En progreso") {
                  data.cell.styles.textColor = [0, 100, 200]
                } else {
                  data.cell.styles.textColor = [255, 140, 0]
                }
              },
            },
          },
        })

        // Get the final Y position after the table
        yPos = (doc as any).lastAutoTable.finalY + 20

        // Add new page if needed for next user
        if (yPos > 250 && reports.indexOf(report) < reports.length - 1) {
          doc.addPage()
          yPos = 20
        }
      })

      // Add footer with confidentiality information and page numbers
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)

        // Línea separadora
        doc.setDrawColor(13, 44, 82, 0.5)
        doc.setLineWidth(0.5)
        doc.line(14, 280, 196, 280)

        // Texto del footer
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(
          "Este documento contiene información confidencial y es para uso exclusivo del personal autorizado.",
          105,
          286,
          { align: "center" },
        )
        doc.text(`Página ${i} de ${pageCount}`, 196, 286, { align: "right" })
      }

      // Save PDF with formatted name
      const dateStr = new Date().toISOString().split("T")[0]
      const timeStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-")
      doc.save(`reporte-tareas-administrativas_${dateStr}_${timeStr}.pdf`)
      setIsGenerating(false)
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      alert("Ocurrió un error al generar el PDF. Por favor, intenta de nuevo.")
      setIsGenerating(false)
    }
  }

  // Cargar tareas desde API al abrir el modal
  useEffect(() => {
    if (!isOpen) return
    let ignore = false
    setLoading(true)
    fetch("/api/tareas_adm")
      .then((r) => r.json())
      .then((data) => {
        if (ignore) return
        const arr = Array.isArray(data?.tareas)
          ? data.tareas
          : Array.isArray(data)
            ? data
            : Array.isArray(data?.tasks)
              ? data.tasks
              : []
        setRawTasks(arr)
      })
      .catch(() => setRawTasks([]))
      .finally(() => setLoading(false))
    return () => {
      ignore = true
    }
  }, [isOpen])

  type NormTask = {
    id: string
    title: string
    assignedTo: string
    status: "pending" | "in-progress" | "completed" | "cancelled" | string
    priority: "low" | "medium" | "high" | string
    createdAt: string
    completedAt?: string | null
  }

  const normalizeTasks = (rows: any[]): NormTask[] => {
    return rows.map((t) => {
      const estado = String(t.estado || "")
      const prioridad = String(t.prioridad || "")
      const status =
        estado === "pendiente"
          ? "pending"
          : estado === "in_progreso"
            ? "in-progress"
            : estado === "completada"
              ? "completed"
              : estado === "cancelada"
                ? "cancelled"
                : estado
      const priority = prioridad === "alta" ? "high" : prioridad === "media" ? "medium" : prioridad === "baja" ? "low" : prioridad
      return {
        id: String(t.id),
        title: t.titulo ?? "(Sin título)",
        assignedTo: t.asignado_a ? String(t.asignado_a) : "",
        status,
        priority,
        createdAt: t.fecha_creacion ?? t.createdAt ?? new Date().toISOString(),
        completedAt: t.fecha_completada ?? t.completedAt ?? null,
      }
    })
  }

  const computeReports = (allTasks: NormTask[], userId?: string, start?: string, end?: string): AdminTaskReport[] => {
    let tasks = [...allTasks]
    // Filtro por usuario
    if (userId) tasks = tasks.filter((t) => String(t.assignedTo) === String(userId))
    // Filtro por fechas (por fecha de creación)
    const startMs = start ? new Date(start).setHours(0, 0, 0, 0) : undefined
    const endMs = end ? new Date(end).setHours(23, 59, 59, 999) : undefined
    if (startMs !== undefined) tasks = tasks.filter((t) => new Date(t.createdAt).getTime() >= startMs)
    if (endMs !== undefined) tasks = tasks.filter((t) => new Date(t.createdAt).getTime() <= endMs)

    if (userId) {
      const byUser = tasks
      const completed = byUser.filter((t) => t.status === "completed")
      const pending = byUser.filter((t) => t.status === "pending")
      const inProgress = byUser.filter((t) => t.status === "in-progress")
      // promedio
      const times = completed
        .filter((t) => t.completedAt)
        .map((t) => (new Date(t.completedAt as string).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : undefined
      const last = completed
        .filter((t) => t.completedAt)
        .sort((a, b) => new Date(b.completedAt as string).getTime() - new Date(a.completedAt as string).getTime())[0]?.completedAt
      const details = byUser.map((t) => ({
        id: t.id,
        title: t.title,
        assignedAt: t.createdAt,
        completedAt: t.completedAt || undefined,
        status: t.status as any,
        priority: t.priority as any,
        timeToComplete: t.completedAt
          ? (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          : undefined,
      }))
      return [
        {
          userId: String(userId),
          userName: getUserName(String(userId)),
          completedTasks: completed.length,
          pendingTasks: pending.length,
          inProgressTasks: inProgress.length,
          totalTasks: byUser.length,
          averageCompletionTime: avg,
          lastCompletedTask: last as any,
          tasks: details,
        },
      ]
    }

    // Agrupar por usuario si no hay filtro
    const userIds = [...new Set(tasks.map((t) => String(t.assignedTo)))]
    return userIds.map((uid) => computeReports(tasks, uid, undefined, undefined)[0]).filter(Boolean) as AdminTaskReport[]
  }

  const normalized = useMemo(() => normalizeTasks(rawTasks), [rawTasks])
  const computedReports: AdminTaskReport[] = useMemo(
    () => computeReports(normalized, selectedUser !== "all" ? selectedUser : undefined, startDate || undefined, endDate || undefined),
    [normalized, selectedUser, startDate, endDate]
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold">Reporte de Tareas Administrativas</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Label htmlFor="user-filter" className="block mb-2">
                Usuario
              </Label>
              <div className="relative">
                <Button
                  id="user-filter"
                  variant="outline"
                  className="w-full flex items-center justify-between bg-gray-200 text-black hover:bg-gray-300"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    {selectedUser === "all" ? "Todos los usuarios" : getUserName(selectedUser)}
                  </div>
                </Button>
                <div
                  className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-10"
                  style={{ display: isUserMenuOpen ? "block" : "none" }}
                >
                  <div className="py-1 max-h-60 overflow-y-auto">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        setSelectedUser("all")
                        setIsUserMenuOpen(false)
                      }}
                    >
                      Todos los usuarios
                    </button>
                    {adminUsers.map((user) => (
                      <button
                        key={user.id}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => {
                          setSelectedUser(user.id)
                          setIsUserMenuOpen(false)
                        }}
                      >
                        {user.firstName} {user.lastName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="start-date" className="block mb-2">
                Fecha inicio
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="start-date"
                  type="date"
                  className="pl-10"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="end-date" className="block mb-2">
                Fecha fin
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="end-date"
                  type="date"
                  className="pl-10"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Resultados del reporte */}
          <div className="space-y-8">
            {computedReports.length === 0 ? (
              <div className="bg-gray-50 border rounded-lg p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h4 className="text-lg font-semibold mb-2">No hay datos disponibles</h4>
                <p className="text-gray-500">No se encontraron tareas que coincidan con los criterios de búsqueda.</p>
              </div>
            ) : (
              computedReports.map((report) => (
                <div
                  key={report.userId}
                  className="border rounded-lg p-6"
                  style={{ boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)" }}
                >
                  <h3 className="text-xl font-semibold mb-4">{getUserName(report.userId)}</h3>

                  {/* Resumen */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{report.totalTasks}</div>
                      <div className="text-gray-500">Total tareas</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{report.completedTasks}</div>
                      <div className="text-green-600">Completadas</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{report.pendingTasks}</div>
                      <div className="text-yellow-600">Pendientes</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold">{report.inProgressTasks}</div>
                      <div className="text-orange-600">En progreso</div>
                    </div>
                  </div>

                  {/* Métricas adicionales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold">Tiempo promedio de completado</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {report.averageCompletionTime
                          ? `${report.averageCompletionTime.toFixed(2)} días`
                          : "No disponible"}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-lg font-semibold">Última tarea completada</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {report.lastCompletedTask ? formatDate(report.lastCompletedTask) : "No disponible"}
                      </div>
                    </div>
                  </div>

                  {/* Tabla de tareas */}
                  <h4 className="text-lg font-semibold mb-3">Detalle de tareas</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-2 px-3 text-left">Título</th>
                          <th className="py-2 px-3 text-left">Asignada</th>
                          <th className="py-2 px-3 text-left">Completada</th>
                          <th className="py-2 px-3 text-left">Estado</th>
                          <th className="py-2 px-3 text-left">Tiempo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.tasks.map((task) => (
                          <tr key={task.id} className="border-t">
                            <td className="py-2 px-3">{task.title}</td>
                            <td className="py-2 px-3">{formatDate(task.assignedAt)}</td>
                            <td className="py-2 px-3">
                              {task.completedAt ? formatDate(task.completedAt) : "Pendiente"}
                            </td>
                            <td className="py-2 px-3">
                              {task.status === "completed" ? (
                                <span className="text-green-600">Completada</span>
                              ) : task.status === "in-progress" ? (
                                <span className="text-orange-600">En progreso</span>
                              ) : (
                                <span className="text-yellow-600">Pendiente</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {task.timeToComplete ? `${task.timeToComplete.toFixed(2)} días` : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Botón para exportar a PDF */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={exportToPDF}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generando PDF...
                </span>
              ) : (
                <span className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar a PDF
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AdminTaskReportModal
