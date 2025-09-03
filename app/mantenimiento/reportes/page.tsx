"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/lib/auth"
import { useAuxiliarTasksStore } from "@/lib/auxiliar-tasks-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Plus, Search, CalendarIcon } from "lucide-react"
import { format, isAfter, isBefore, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import NewReportModal from "@/components/mantenimiento/new-report-modal"
import ReportDetailModal from "@/components/mantenimiento/report-detail-modal"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"

export default function AuxiliarReports() {
  const { user, isAuthenticated, isMantenimiento } = useAuthStore()
  const { reports } = useAuxiliarTasksStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !isMantenimiento) {
      router.push("/home")
    }
  }, [isAuthenticated, isMantenimiento, router])

  // Filtrar actividades por auxiliar
  const myReports = user ? reports.filter((report) => report.auxiliarId === user.id) : []

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: es })
  }

  // Filtrar actividades por búsqueda y fecha
  const getFilteredReports = () => {
    let filtered = myReports

    // Filtrar por texto de búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (report) => report.title.toLowerCase().includes(query) || report.description.toLowerCase().includes(query),
      )
    }

    // Filtrar por rango de fechas
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((report) => {
        const reportDate = parseISO(report.createdAt)

        if (dateRange.from && dateRange.to) {
          return isAfter(reportDate, dateRange.from) && isBefore(reportDate, dateRange.to)
        } else if (dateRange.from) {
          return isAfter(reportDate, dateRange.from)
        } else if (dateRange.to) {
          return isBefore(reportDate, dateRange.to)
        }

        return true
      })
    }

    return filtered
  }

  const filteredReports = getFilteredReports()

  // Función para abrir el modal de detalle
  const openReportDetail = (reportId: string) => {
    setSelectedReport(reportId)
    setIsDetailModalOpen(true)
  }

  // Función para limpiar los filtros
  const clearFilters = () => {
    setSearchQuery("")
    setDateRange({ from: undefined, to: undefined })
  }

  // Formatear el rango de fechas para mostrar
  const formatDateRangeDisplay = () => {
    if (!dateRange.from && !dateRange.to) return "Filtrar por fecha"

    if (dateRange.from && dateRange.to) {
      if (format(dateRange.from, "dd/MM/yyyy") === format(dateRange.to, "dd/MM/yyyy")) {
        return format(dateRange.from, "dd/MM/yyyy")
      }
      return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
    }

    if (dateRange.from) return `Desde ${format(dateRange.from, "dd/MM/yyyy")}`
    if (dateRange.to) return `Hasta ${format(dateRange.to, "dd/MM/yyyy")}`

    return "Filtrar por fecha"
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isCalendarOpen && !target.closest(".calendar-container")) {
        setIsCalendarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isCalendarOpen])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-black">Mis Actividades</h1>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setIsNewReportModalOpen(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nueva
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar actividades..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de fecha simple */}
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2 bg-white text-black border-gray-300 w-full justify-start"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              >
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span>{formatDateRangeDisplay()}</span>
              </Button>

              {isCalendarOpen && (
                <div className="absolute z-50 mt-1 bg-white rounded-md shadow-lg border border-gray-200 calendar-container">
                  <div className="p-3">
                    <Calendar
                      mode="range"
                      selected={{
                        from: dateRange.from || undefined,
                        to: dateRange.to || undefined,
                      }}
                      onSelect={(range) => {
                        setDateRange({
                          from: range?.from,
                          to: range?.to,
                        })
                      }}
                      numberOfMonths={1}
                      locale={es}
                    />
                    <div className="flex justify-between mt-4 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange({ from: undefined, to: undefined })
                          setIsCalendarOpen(false)
                        }}
                      >
                        Limpiar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setIsCalendarOpen(false)}
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(searchQuery || dateRange.from || dateRange.to) && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="text-gray-500">
                Limpiar filtros
              </Button>
            )}
          </div>

          <span className="text-xs text-gray-500">
            {filteredReports.length} {filteredReports.length === 1 ? "actividad" : "actividades"}
          </span>
        </div>
      </div>

      {/* Lista de actividades */}
      {filteredReports.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 text-center shadow-sm">
          <FileText className="h-10 w-10 mx-auto text-gray-400 mb-3" />
          <h4 className="text-base font-semibold mb-2">No hay actividades</h4>
          <p className="text-sm text-gray-500 mb-3">
            {searchQuery || dateRange.from || dateRange.to
              ? "No se encontraron actividades que coincidan con tus filtros."
              : "No has creado ninguna actividad todavía."}
          </p>
          {(searchQuery || dateRange.from || dateRange.to) && (
            <Button variant="outline" className="bg-gray-200 text-black hover:bg-gray-300" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 pb-16">
          {filteredReports
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((report) => (
              <div
                key={report.id}
                className="bg-white border rounded-lg p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer shadow-sm"
                onClick={() => openReportDetail(report.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <h3 className="font-medium text-sm text-black">{report.title}</h3>
                    {report.taskId && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Tarea</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">{formatDate(report.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{report.description}</p>

                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {report.section && <span>Sección: {report.section}</span>}
                  {report.condominium && <span>• {report.condominium.split("-")[1] || report.condominium}</span>}
                </div>

                {/* Mostrar miniaturas si hay imágenes */}
                {report.images && report.images.length > 0 && (
                  <div className="flex -space-x-2 overflow-hidden mt-2">
                    {report.images.slice(0, 3).map((img, index) => (
                      <div key={index} className="inline-block h-6 w-6 rounded-full border border-white">
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`Imagen ${index + 1}`}
                          className="h-full w-full object-cover rounded-full"
                        />
                      </div>
                    ))}
                    {report.images.length > 3 && (
                      <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 border border-white text-xs font-medium">
                        +{report.images.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Modal para nueva actividad */}
      <NewReportModal isOpen={isNewReportModalOpen} onClose={() => setIsNewReportModalOpen(false)} />

      {/* Modal de detalle de actividad */}
      {selectedReport && (
        <ReportDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          reportId={selectedReport}
        />
      )}
    </div>
  )
}
