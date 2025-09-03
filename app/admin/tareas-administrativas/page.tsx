
"use client"
import React from "react"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  CheckSquare,
  Clock,
  Filter,
  Search,
  CheckCircle,
  Circle,
  XCircle,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthGuard from "@/components/auth-guard"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useAdminTasksStore } from "@/lib/admin-tasks-store"
import { useAuthStore } from "@/lib/auth"
import NewAdminTaskModal from "@/components/admin/new-admin-task-modal"
import AdminTaskReportModal from "@/components/admin/admin-task-report-modal"
import AdminTaskDetailModal from "@/components/admin/admin-task-detail-modal"

export default function AdminTasksPage() {
  const { user, users } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const [userFilter, setUserFilter] = useState("all");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isDepartmentMenuOpen, setIsDepartmentMenuOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Obtener tareas administrativas desde el API SQL
  React.useEffect(() => {
    fetch("/api/tareas_adm")
      .then(res => res.json())
      .then(data => {
        const tareasRaw = Array.isArray(data?.tareas) ? data.tareas : Array.isArray(data?.tasks) ? data.tasks : Array.isArray(data) ? data : [];
        // Mapeo de campos de la base de datos a los del frontend
        const tareas = tareasRaw.map((t: any) => ({
          id: String(t.id),
          title: t.titulo ?? "(Sin título)",
          description: t.descripcion ?? "",
          assignedTo: t.asignado_a ? String(t.asignado_a) : "",
          createdBy: t.creado_por ? String(t.creado_por) : "",
          condominiumId: t.condominio_id ? String(t.condominio_id) : "",
          priority: t.prioridad === 'alta' ? 'high' : t.prioridad === 'media' ? 'medium' : 'low',
          status:
            t.estado === 'pendiente'
              ? 'pending'
              : t.estado === 'in_progreso'
                ? 'in-progress'
                : t.estado === 'completada'
                  ? 'completed'
                  : t.estado === 'cancelada'
                    ? 'cancelled'
                    : String(t.estado || ''),
          department: t.departamento ?? '',
          category: t.categoria ?? '', // no está en la tabla, pero mantenemos si llega desde otra fuente
          createdAt: t.fecha_creacion ?? null,
          dueDate: t.fecha_vencimiento ?? null,
          completedAt: t.fecha_completada ?? null,
          notes: t.notas ?? '',
        }));
        setTasks(tareas);
        console.log("Tareas administrativas mapeadas:", tareas);
      })
      .catch(() => setTasks([]));
  }, []);

  // Filtrar tareas por estado
  const pendingTasks = tasks.filter((task) => task.status === "pending")
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress")
  const completedTasks = tasks.filter((task) => task.status === "completed")

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
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha"
    return format(new Date(dateString), "dd MMM yyyy", { locale: es })
  }

  // Función para obtener el nombre del usuario
  const getUserName = (userId: string) => {
    const user = users.find((u) => String(u.id) === String(userId))
    return user ? `${user.firstName} ${user.lastName}` : "Usuario desconocido"
  }

  // Función para manejar el cambio de estado de una tarea (actualiza en el backend SQL)
  const handleStatusChange = async (taskId: string, newStatus: "pending" | "in-progress" | "completed") => {
    try {
      const dbEstado = newStatus === 'pending' ? 'pendiente' : newStatus === 'in-progress' ? 'in_progreso' : 'completada'
      await fetch(`/api/tareas_adm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, estado: dbEstado, fecha_completada: newStatus === 'completed' ? new Date().toISOString().slice(0,19).replace('T',' ') : null }),
      });
      // Refrescar tareas después de actualizar
      fetch("/api/tareas_adm")
        .then(res => res.json())
        .then(data => {
          const tareasRaw = Array.isArray(data?.tareas) ? data.tareas : Array.isArray(data?.tasks) ? data.tasks : Array.isArray(data) ? data : [];
          const tareas = tareasRaw.map((t: any) => ({
            id: String(t.id),
            title: t.titulo ?? "(Sin título)",
            description: t.descripcion ?? "",
            assignedTo: t.asignado_a ? String(t.asignado_a) : "",
            createdBy: t.creado_por ? String(t.creado_por) : "",
            condominiumId: t.condominio_id ? String(t.condominio_id) : "",
            priority: t.prioridad === 'alta' ? 'high' : t.prioridad === 'media' ? 'medium' : 'low',
            status: t.estado === 'pendiente' ? 'pending' : t.estado === 'in_progreso' ? 'in-progress' : t.estado === 'completada' ? 'completed' : t.estado === 'cancelada' ? 'cancelled' : String(t.estado || ''),
            department: t.departamento ?? '',
            category: t.categoria ?? '',
            createdAt: t.fecha_creacion ?? null,
            dueDate: t.fecha_vencimiento ?? null,
            completedAt: t.fecha_completada ?? null,
            notes: t.notas ?? '',
          }));
          setTasks(tareas);
        });
    } catch (err) {
      // Manejo de error
    }
  };

  // Eliminar tarea en el backend y refrescar
  const deleteTask = async (taskId: string) => {
    try {
      await fetch(`/api/tareas_adm?id=${encodeURIComponent(taskId)}`, { method: "DELETE" });
      // Refrescar lista
      fetch("/api/tareas_adm")
        .then(res => res.json())
        .then(data => {
          const tareasRaw = Array.isArray(data?.tareas) ? data.tareas : Array.isArray(data?.tasks) ? data.tasks : Array.isArray(data) ? data : [];
          const tareas = tareasRaw.map((t: any) => ({
            id: String(t.id),
            title: t.titulo ?? "(Sin título)",
            description: t.descripcion ?? "",
            assignedTo: t.asignado_a ? String(t.asignado_a) : "",
            createdBy: t.creado_por ? String(t.creado_por) : "",
            condominiumId: t.condominio_id ? String(t.condominio_id) : "",
            priority: t.prioridad === 'alta' ? 'high' : t.prioridad === 'media' ? 'medium' : 'low',
            status: t.estado === 'pendiente' ? 'pending' : t.estado === 'in_progreso' ? 'in-progress' : t.estado === 'completada' ? 'completed' : t.estado === 'cancelada' ? 'cancelled' : String(t.estado || ''),
            department: t.departamento ?? '',
            category: t.categoria ?? '',
            createdAt: t.fecha_creacion ?? null,
            dueDate: t.fecha_vencimiento ?? null,
            completedAt: t.fecha_completada ?? null,
            notes: t.notas ?? '',
          }));
          setTasks(tareas);
        });
    } catch (e) {
      // noop
    }
  }

  // Obtener departamentos únicos
  const uniqueDepartments = [...new Set(tasks.map((task) => task.department).filter(Boolean))]

  // Filtrar tareas según los criterios
  const getFilteredTasks = () => {
    let filtered = [...tasks]

    // Filtrar por estado
    if (activeTab !== "all") {
      filtered = filtered.filter((task) => task.status === activeTab)
    }

    // Filtrar por prioridad
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    // Filtrar por usuario asignado
    if (userFilter !== "all") {
      filtered = filtered.filter((task) => task.assignedTo === userFilter)
    }

    // Filtrar por departamento
    if (departmentFilter !== "all") {
      filtered = filtered.filter((task) => task.department === departmentFilter)
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query)) ||
          (task.department && task.department.toLowerCase().includes(query)) ||
          (task.category && task.category.toLowerCase().includes(query)),
      )
    }

    return filtered
  }

  const filteredTasks = getFilteredTasks()

  // Estadísticas
  const taskStats = {
    total: tasks.length,
    pending: pendingTasks.length,
    inProgress: inProgressTasks.length,
    completed: completedTasks.length,
  };

  // Obtener solo usuarios administrativos
  const adminUsers = users.filter((user) => user.role === "admin");

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <header className="container mx-auto py-4 px-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="flex items-center text-white hover:text-gray-200">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Volver al panel administrativo
            </Link>
          </div>
        </header>

        <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-7xl text-gray-800 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Gestión de Tareas Administrativas</h2>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="border rounded-lg p-6 flex flex-col items-center">
                <div className="bg-blue-100 p-3 rounded-full mb-4">
                  <CheckSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-4xl font-bold">{taskStats.total}</div>
                <div className="text-gray-500">Tareas totales</div>
              </div>

              <div className="border rounded-lg p-6 flex flex-col items-center">
                <div className="bg-yellow-100 p-3 rounded-full mb-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-4xl font-bold">{taskStats.pending}</div>
                <div className="text-gray-500">Pendientes</div>
              </div>

              <div className="border rounded-lg p-6 flex flex-col items-center">
                <div className="bg-orange-100 p-3 rounded-full mb-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-4xl font-bold">{taskStats.inProgress}</div>
                <div className="text-gray-500">En progreso</div>
              </div>

              <div className="border rounded-lg p-6 flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-4xl font-bold">{taskStats.completed}</div>
                <div className="text-gray-500">Completadas</div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-end">
              <Button
                variant="outline"
                className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300"
                onClick={() => setIsReportModalOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
              <Button variant="default" className="bg-blue-600" onClick={() => setIsNewTaskModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva tarea
              </Button>
            </div>

            {/* Pestañas de estado */}
            <div className="flex border-b mb-6">
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === "all" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
                }`}
                onClick={() => setActiveTab("all")}
              >
                Todas
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === "pending" ? "border-b-2 border-yellow-500 text-yellow-600" : "text-gray-500"
                }`}
                onClick={() => setActiveTab("pending")}
              >
                Pendientes
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === "in-progress" ? "border-b-2 border-orange-500 text-orange-600" : "text-gray-500"
                }`}
                onClick={() => setActiveTab("in-progress")}
              >
                En progreso
              </button>
              <button
                className={`py-2 px-4 font-medium ${
                  activeTab === "completed" ? "border-b-2 border-green-500 text-green-600" : "text-gray-500"
                }`}
                onClick={() => setActiveTab("completed")}
              >
                Completadas
              </button>
            </div>

            {/* Lista de tareas */}
            <div className="border rounded-lg p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por título, descripción, departamento o categoría..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Filtro de prioridad */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="flex items-center bg-gray-200 text-black hover:bg-gray-300"
                      onClick={() => setIsPriorityMenuOpen(!isPriorityMenuOpen)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {priorityFilter === "all"
                        ? "Todas las prioridades"
                        : priorityFilter === "high"
                          ? "Prioridad alta"
                          : priorityFilter === "medium"
                            ? "Prioridad media"
                            : "Prioridad baja"}
                    </Button>
                    <div
                      className="absolute mt-1 w-48 bg-white border rounded-md shadow-lg z-10"
                      style={{ display: isPriorityMenuOpen ? "block" : "none" }}
                    >
                      <div className="py-1">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setPriorityFilter("all")
                            setIsPriorityMenuOpen(false)
                          }}
                        >
                          Todas las prioridades
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setPriorityFilter("high")
                            setIsPriorityMenuOpen(false)
                          }}
                        >
                          Prioridad alta
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setPriorityFilter("medium")
                            setIsPriorityMenuOpen(false)
                          }}
                        >
                          Prioridad media
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setPriorityFilter("low")
                            setIsPriorityMenuOpen(false)
                          }}
                        >
                          Prioridad baja
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filtro de usuario */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="flex items-center bg-gray-200 text-black hover:bg-gray-300"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {userFilter === "all" ? "Todos los usuarios" : `Asignado a: ${getUserName(userFilter)}`}
                    </Button>
                    <div
                      className="absolute mt-1 w-64 bg-white border rounded-md shadow-lg z-10"
                      style={{ display: isUserMenuOpen ? "block" : "none" }}
                    >
                      <div className="py-1 max-h-60 overflow-y-auto">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setUserFilter("all")
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
                              setUserFilter(user.id)
                              setIsUserMenuOpen(false)
                            }}
                          >
                            {user.firstName} {user.lastName}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Filtro de departamento */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      className="flex items-center bg-gray-200 text-black hover:bg-gray-300"
                      onClick={() => setIsDepartmentMenuOpen(!isDepartmentMenuOpen)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {departmentFilter === "all" ? "Todos los departamentos" : `Departamento: ${departmentFilter}`}
                    </Button>
                    <div
                      className="absolute mt-1 w-64 bg-white border rounded-md shadow-lg z-10"
                      style={{ display: isDepartmentMenuOpen ? "block" : "none" }}
                    >
                      <div className="py-1 max-h-60 overflow-y-auto">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={() => {
                            setDepartmentFilter("all")
                            setIsDepartmentMenuOpen(false)
                          }}
                        >
                          Todos los departamentos
                        </button>
                        {uniqueDepartments.map((dept) => (
                          <button
                            key={dept}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => {
                              setDepartmentFilter(dept!)
                              setIsDepartmentMenuOpen(false)
                            }}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="bg-gray-50 border rounded-lg p-8 text-center">
                  <CheckSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No hay tareas</h4>
                  <p className="text-gray-500 mb-4">
                    {searchQuery
                      ? "No se encontraron tareas que coincidan con tu búsqueda."
                      : `No hay tareas ${
                          activeTab === "all"
                            ? ""
                            : activeTab === "pending"
                              ? "pendientes"
                              : activeTab === "in-progress"
                                ? "en progreso"
                                : "completadas"
                        } en este momento.`}
                  </p>
                  <Button
                    variant="outline"
                    className="bg-gray-200 text-black hover:bg-gray-300"
                    onClick={() => {
                      setSearchQuery("")
                      setPriorityFilter("all")
                      setUserFilter("all")
                      setDepartmentFilter("all")
                      setActiveTab("all")
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
                        <th className="py-3 px-4 text-left">Departamento</th>
                        <th className="py-3 px-4 text-left">Asignado a</th>
                        <th className="py-3 px-4 text-left">Prioridad</th>
                        <th className="py-3 px-4 text-left">Fecha</th>
                        <th className="py-3 px-4 text-left">Estado</th>
                        <th className="py-3 px-4 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks
                        .sort((a, b) => {
                          // Ordenar por estado (pendientes primero, luego en progreso, luego completadas)
                          const getStatusRank = (s: string) => ({ pending: 0, "in-progress": 1, completed: 2 } as Record<string, number>)[s] ?? 99
                          const statusDiff = getStatusRank(a.status) - getStatusRank(b.status)
                          if (statusDiff !== 0) return statusDiff

                          // Luego por prioridad (alta primero, luego media, luego baja)
                          const getPriorityRank = (p: string) => ({ high: 0, medium: 1, low: 2 } as Record<string, number>)[p] ?? 99
                          const priorityDiff = getPriorityRank(a.priority) - getPriorityRank(b.priority)
                          if (priorityDiff !== 0) return priorityDiff

                          // Finalmente por fecha de creación (más recientes primero)
                          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        })
                        .map((task) => (
                          <tr key={task.id} className="border-b">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <button
                                  className={"text-left " + (task.status === "completed" ? "line-through text-gray-400" : "font-medium text-blue-700 hover:underline")}
                                  onClick={() => { setSelectedTask(task); setDetailOpen(true); }}
                                >
                                  {task.title}
                                </button>
                                {task.description && (
                                  <span className="text-sm text-gray-500 line-clamp-1">{task.description}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="text-sm">{task.department}</span>
                                <span className="text-xs text-gray-500">{task.category}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium">{getUserName(task.assignedTo)}</span>
                                <span className="text-xs text-blue-600">Administrador</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                                {getPriorityText(task.priority)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                <span className="text-sm">Creada: {formatDate(task.createdAt || undefined)}</span>
                                {task.completedAt && (
                                  <span className="text-xs text-green-600">
                  Completada: {formatDate(task.completedAt || undefined)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {task.status === "completed" ? (
                                <Badge className="bg-green-500 text-white">Completada</Badge>
                              ) : task.status === "in-progress" ? (
                                <Badge className="bg-orange-500 text-white">En progreso</Badge>
                              ) : (
                                <Badge className="bg-yellow-500 text-white">Pendiente</Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                {task.status !== "completed" && (
                                  <>
                                    {task.status === "pending" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-gray-200 text-black hover:bg-gray-300"
                                        onClick={() => handleStatusChange(task.id, "in-progress")}
                                      >
                                        <Clock className="h-4 w-4 mr-1" />
                                        Iniciar
                                      </Button>
                                    )}
                                    {task.status === "in-progress" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="bg-gray-200 text-black hover:bg-gray-300"
                                        onClick={() => handleStatusChange(task.id, "pending")}
                                      >
                                        <Circle className="h-4 w-4 mr-1" />
                                        Pausar
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-green-500 text-white hover:bg-green-600"
                                      onClick={() => handleStatusChange(task.id, "completed")}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Completar
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-500 text-white hover:bg-red-600"
                                  onClick={() => deleteTask(task.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Eliminar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        <NewAdminTaskModal isOpen={isNewTaskModalOpen} onClose={() => setIsNewTaskModalOpen(false)} />
        <AdminTaskReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
      </main>
  <AdminTaskDetailModal isOpen={detailOpen} task={selectedTask} onClose={() => setDetailOpen(false)} getUserName={getUserName} />
    </AuthGuard>
  )
}
