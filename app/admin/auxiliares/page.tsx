"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/auth"
import { useAuxiliarTasksStore } from "@/lib/auxiliar-tasks-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CheckCircle, Clock, Filter, Plus, Search, User, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import NewAuxiliarTaskModal from "@/components/admin/new-auxiliar-task-modal"
import AuxiliarTaskDetailModal from "@/components/admin/auxiliar-task-detail-modal"
import AuthGuard from "@/components/auth-guard"
import AuxiliarTaskReportModal from "@/components/admin/auxiliar-task-report-modal"

export default function AdminAuxiliarTasks() {
  const { users } = useAuthStore()
  const { tasks } = useAuxiliarTasksStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [auxiliarFilter, setAuxiliarFilter] = useState("all")
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
  const [isAuxiliarMenuOpen, setIsAuxiliarMenuOpen] = useState(false)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Obtener personal de mantenimiento
  const mantenimientoPersonal = users.filter((user) => user.role === "mantenimiento")

  // Función para obtener el color de la prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  // Función para obtener el texto de la prioridad
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta"
      case "medium":
        return "Media"
      case "low":
        return "Baja"
      default:
        return "Normal"
    }
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy", { locale: es })
  }

  // Filtrar tareas según los criterios
  const getFilteredTasks = () => {
    let filtered = [...tasks]

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    // Filtrar por personal de mantenimiento
    if (auxiliarFilter !== "all") {
      filtered = filtered.filter((task) => task.assignedTo === auxiliarFilter)
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)),
      )
    }

    return filtered
  }

  const filteredTasks = getFilteredTasks()

  // Función para abrir el modal de detalle
  const openTaskDetail = (taskId: string) => {
    setSelectedTask(taskId)
    setIsDetailModalOpen(true)
  }

  // Obtener nombre de personal de mantenimiento
  const getMantenimientoName = (mantenimientoId: string) => {
    const mantenimiento = users.find((user) => user.id === mantenimientoId)
    return mantenimiento ? `${mantenimiento.firstName} ${mantenimiento.lastName}` : "Desconocido"
  }

  // Estadísticas
  const pendingTasks = tasks.filter((task) => task.status === "pending").length
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length
  const completedTasks = tasks.filter((task) => task.status === "completed").length

  return (
    <AuthGuard requireAuth requireAdmin>
      <div className="bg-white rounded-lg p-6 w-full text-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Tareas de Mantenimiento</h1>
          <div className="flex gap-2">
            <Button className="bg-green-600 text-white hover:bg-green-700" onClick={() => setIsReportModalOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Generar Reporte
            </Button>
            <Button className="bg-blue-600 text-white" onClick={() => setIsNewTaskModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4 flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold">{pendingTasks}</p>
            </div>
          </div>
          <div className="border rounded-lg p-4 flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En Progreso</p>
              <p className="text-2xl font-bold">{inProgressTasks}</p>
            </div>
          </div>
          <div className="border rounded-lg p-4 flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completadas</p>
              <p className="text-2xl font-bold">{completedTasks}</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar tareas..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Button
                variant="outline"
                className="flex items-center bg-gray-200 text-black hover:bg-gray-300"
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter === "all"
                  ? "Todos los estados"
                  : statusFilter === "pending"
                    ? "Pendientes"
                    : statusFilter === "in-progress"
                      ? "En progreso"
                      : "Completadas"}
              </Button>
              <div
                className="absolute mt-1 w-48 bg-white border rounded-md shadow-lg z-10"
                style={{ display: isStatusMenuOpen ? "block" : "none" }}
              >
                <div className="py-1">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setStatusFilter("all")
                      setIsStatusMenuOpen(false)
                    }}
                  >
                    Todos los estados
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setStatusFilter("pending")
                      setIsStatusMenuOpen(false)
                    }}
                  >
                    Pendientes
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setStatusFilter("in-progress")
                      setIsStatusMenuOpen(false)
                    }}
                  >
                    En progreso
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setStatusFilter("completed")
                      setIsStatusMenuOpen(false)
                    }}
                  >
                    Completadas
                  </button>
                </div>
              </div>
            </div>
            <div className="relative">
              <Button
                variant="outline"
                className="flex items-center bg-gray-200 text-black hover:bg-gray-300"
                onClick={() => setIsAuxiliarMenuOpen(!isAuxiliarMenuOpen)}
              >
                <User className="h-4 w-4 mr-2" />
                {auxiliarFilter === "all" ? "Todo el personal" : getMantenimientoName(auxiliarFilter)}
              </Button>
              <div
                className="absolute mt-1 w-48 bg-white border rounded-md shadow-lg z-10"
                style={{ display: isAuxiliarMenuOpen ? "block" : "none" }}
              >
                <div className="py-1">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setAuxiliarFilter("all")
                      setIsAuxiliarMenuOpen(false)
                    }}
                  >
                    Todo el personal
                  </button>
                  {mantenimientoPersonal.map((person) => (
                    <button
                      key={person.id}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => {
                        setAuxiliarFilter(person.id)
                        setIsAuxiliarMenuOpen(false)
                      }}
                    >
                      {person.firstName} {person.lastName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de tareas */}
        {filteredTasks.length === 0 ? (
          <div className="bg-gray-50 border rounded-lg p-8 text-center">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold mb-2">No hay tareas</h4>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== "all" || auxiliarFilter !== "all"
                ? "No se encontraron tareas que coincidan con los filtros aplicados."
                : "No hay tareas asignadas al personal de mantenimiento en este momento."}
            </p>
            <Button
              variant="outline"
              className="bg-gray-200 text-black hover:bg-gray-300"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setAuxiliarFilter("all")
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 px-4 text-left">Tarea</th>
                  <th className="py-3 px-4 text-left">Personal</th>
                  <th className="py-3 px-4 text-left">Condominio</th>
                  <th className="py-3 px-4 text-left">Sección</th>
                  <th className="py-3 px-4 text-left">Prioridad</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                  <th className="py-3 px-4 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks
                  .sort((a, b) => {
                    // Ordenar por estado (pendientes primero, luego en progreso, luego completadas)
                    const statusOrder = { pending: 0, "in-progress": 1, completed: 2 }
                    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
                    if (statusDiff !== 0) return statusDiff

                    // Luego por prioridad (alta primero, luego media, luego baja)
                    const priorityOrder = { high: 0, medium: 1, low: 2 }
                    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
                    if (priorityDiff !== 0) return priorityDiff

                    // Finalmente por fecha de creación (más recientes primero)
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  })
                  .map((task) => (
                    <tr
                      key={task.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => openTaskDetail(task.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className={task.status === "completed" ? "line-through text-gray-400" : "font-medium"}>
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-sm text-gray-500 line-clamp-1">{task.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getMantenimientoName(task.assignedTo)}</td>
                      <td className="py-3 px-4">{task.condominium || "No especificado"}</td>
                      <td className="py-3 px-4">{task.section || "No especificada"}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                          {getPriorityText(task.priority)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {task.status === "pending" ? (
                          <Badge className="bg-yellow-500 text-white">Pendiente</Badge>
                        ) : task.status === "in-progress" ? (
                          <Badge className="bg-blue-500 text-white">En progreso</Badge>
                        ) : (
                          <Badge className="bg-green-500 text-white">Completada</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">{formatDate(task.createdAt)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal para nueva tarea */}
        <NewAuxiliarTaskModal isOpen={isNewTaskModalOpen} onClose={() => setIsNewTaskModalOpen(false)} />

        {/* Modal de detalle de tarea */}
        {selectedTask && (
          <AuxiliarTaskDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            taskId={selectedTask}
          />
        )}

        {/* Modal para generar reporte */}
        <AuxiliarTaskReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
      </div>
    </AuthGuard>
  )
}
