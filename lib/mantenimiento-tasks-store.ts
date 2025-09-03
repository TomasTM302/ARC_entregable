// Archivo migrado desde auxiliar-tasks-store.ts para unificar bajo mantenimiento
import { create } from "zustand"

// Nota: Store migrado parcialmente a persistencia vía API /api/personal_mantenimiento/tareas
// Las operaciones ahora intentan sincronizar con backend manteniendo actualización optimista.

export type TaskStatus = "pending" | "in-progress" | "completed"
export type TaskPriority = "low" | "medium" | "high"

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignedTo: string
  assignedBy: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  comments?: Comment[]
  isPersonalReminder?: boolean
  section?: string
  condominium?: string
}

export interface Comment {
  id: string
  taskId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

export interface Report {
  id: string
  title: string
  description: string
  mantenimientoId: string
  mantenimientoName: string
  createdAt: string
  images?: string[]
  taskId?: string
  status: "pending" | "reviewed" | "completed"
  section?: string
  condominium?: string
}

interface MantenimientoTasksState {
  tasks: Task[]
  reports: Report[]
  loadingTasks: boolean
  errorTasks?: string | null
  fetchTasks: (opts: { auxiliarId: string; estado?: TaskStatus }) => Promise<void>
  addTask: (task: {
    title: string
    description?: string
    priority: TaskPriority
    assignedTo: string
    assignedBy: string
    condominiumId?: number | null
    sectionId?: number | null
    dueDate?: string | null
    isPersonalReminder?: boolean
  }) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  completeTask: (id: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  addComment: (taskId: string, userId: string, userName: string, content: string) => void // local todavía
  addReport: (report: Omit<Report, "id" | "createdAt">) => void // aún local
  updateReport: (id: string, updates: Partial<Report>) => void
  deleteReport: (id: string) => void
}

export const useMantenimientoTasksStore = create<MantenimientoTasksState>((set, get) => ({
  tasks: [],
  reports: [],
  loadingTasks: false,
  errorTasks: null,
  fetchTasks: async ({ auxiliarId, estado }) => {
    set({ loadingTasks: true, errorTasks: null })
    try {
      const params = new URLSearchParams()
      params.set('auxiliarId', auxiliarId)
      if (estado) params.set('estado', estado)
  const res = await fetch(`/api/personal_mantenimiento/tareas?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'Error desconocido')
      set({ tasks: data.tareas || [] })
    } catch (e:any) {
      set({ errorTasks: e.message })
    } finally {
      set({ loadingTasks: false })
    }
  },
  addTask: async (taskInput) => {
    // Optimista
    const tempId = `temp-${Date.now()}`
    const optimisticTask: Task = {
      id: tempId,
      title: taskInput.title,
      description: taskInput.description,
      status: 'pending',
      priority: taskInput.priority,
      assignedTo: taskInput.assignedTo,
      assignedBy: taskInput.assignedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      isPersonalReminder: !!taskInput.isPersonalReminder,
      section: taskInput.sectionId ? String(taskInput.sectionId) : undefined,
      condominium: taskInput.condominiumId ? String(taskInput.condominiumId) : undefined,
    }
    set(state => ({ tasks: [optimisticTask, ...state.tasks] }))
    try {
  const res = await fetch('/api/personal_mantenimiento/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskInput.title,
          description: taskInput.description,
          assignedTo: taskInput.assignedTo,
          assignedBy: taskInput.assignedBy,
          priority: taskInput.priority,
          condominiumId: taskInput.condominiumId || null,
          sectionId: taskInput.sectionId || null,
          dueDate: taskInput.dueDate || null,
          isPersonalReminder: taskInput.isPersonalReminder || false,
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Error creando tarea')
      // Reemplazar optimista
      set(state => ({ tasks: state.tasks.map(t => t.id === tempId ? { ...t, ...data.tarea, id: String(data.tarea.id) } : t) }))
    } catch (e) {
      // revertir
      set(state => ({ tasks: state.tasks.filter(t => t.id !== tempId) }))
      console.error('addTask error', e)
    }
  },
  updateTask: async (id, updates) => {
    const existing = get().tasks.find(t => t.id === id)
    if (!existing) return
    const prev = { ...existing }
    const merged: Task = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    set(state => ({ tasks: state.tasks.map(t => t.id === id ? merged : t) }))
    try {
  const res = await fetch('/api/personal_mantenimiento/tareas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existing.id,
          title: updates.title,
            description: updates.description,
            priority: updates.priority,
            status: updates.status,
            dueDate: (updates as any).dueDate,
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Error al actualizar')
      set(state => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, ...data.tarea, id: String(data.tarea.id) } : t) }))
    } catch (e) {
      // revertir
      set(state => ({ tasks: state.tasks.map(t => t.id === id ? prev : t) }))
      console.error('updateTask error', e)
    }
  },
  completeTask: async (id) => {
    await get().updateTask(id, { status: 'completed' })
  },
  deleteTask: async (id) => {
    const prev = get().tasks
    set({ tasks: prev.filter(t => t.id !== id) })
    try {
  const res = await fetch(`/api/personal_mantenimiento/tareas?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || 'Error al eliminar')
    } catch (e) {
      console.error('deleteTask error', e)
      set({ tasks: prev }) // revertir
    }
  },
  addComment: (taskId, userId, userName, content) => {
    // Aún local (no hay endpoint de comentarios implementado)
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              comments: [
                ...(task.comments || []),
                {
                  id: `comment-${Date.now()}`,
                  taskId,
                  userId,
                  userName,
                  content,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : task,
      ),
    }))
  },
  addReport: (report) => {
    set((state) => ({
      reports: [
        ...state.reports,
        {
          ...report,
          id: `report-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }))
  },
  updateReport: (id, updates) => {
    set((state) => ({
      reports: state.reports.map((report) => (report.id === id ? { ...report, ...updates } : report)),
    }))
  },
  deleteReport: (id) => {
    set((state) => ({
      reports: state.reports.filter((report) => report.id !== id),
    }))
  },
}))
