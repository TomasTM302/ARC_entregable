import { create } from "zustand"

export type TaskStatus = "pending" | "in-progress" | "completed"
export type TaskPriority = "low" | "medium" | "high"

// Actualizar la interfaz Task para incluir los campos de sección y condominio
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
  section?: string // Cambiado de condominio a sección
  condominium?: string // Nuevo campo para condominio
}

export interface Comment {
  id: string
  taskId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

// Actualizar la interfaz AuxiliarTaskReport para incluir el campo taskId
export interface Report {
  id: string
  title: string
  description: string
  auxiliarId: string
  auxiliarName: string
  createdAt: string
  images?: string[]
  taskId?: string
  status: "pending" | "reviewed" | "completed"
  section?: string // Añadido para guardar la sección
  condominium?: string // Añadido para guardar el condominio
}

interface AuxiliarTasksState {
  tasks: Task[]
  reports: Report[]
  addTask: (task: Omit<Task, "id" | "createdAt" | "comments" | "updatedAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  completeTask: (id: string) => void
  deleteTask: (id: string) => void
  addComment: (taskId: string, userId: string, userName: string, content: string) => void
  addReport: (report: Omit<Report, "id" | "createdAt">) => void
  updateReport: (id: string, updates: Partial<Report>) => void
  deleteReport: (id: string) => void
}


export const useAuxiliarTasksStore = create<AuxiliarTasksState>((set) => ({
  tasks: [],
  reports: [],
  // Métodos locales de tareas se mantienen igual
  addTask: (task) => {
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          ...task,
          id: `task-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          comments: [],
        },
      ],
    }))
  },
  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task,
      ),
    }))
  },
  completeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === id ? { ...task, status: "completed" } : task)),
    }))
  },
  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }))
  },
  addComment: (taskId, userId, userName, content) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              comments: [
                ...((task.comments ?? []) as any[]),
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
  // Métodos migrados a API para reportes
  fetchReports: async (auxiliarId: string, condominioId?: string) => {
    try {
      const params = new URLSearchParams({ auxiliarId })
      if (condominioId) params.append("condominioId", condominioId)
      const res = await fetch(`/api/personal_mantenimiento/reportes?${params.toString()}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.reportes)) {
        set({ reports: data.reportes })
      } else {
        set({ reports: [] })
      }
    } catch {
      set({ reports: [] })
    }
  },
  addReport: async (report) => {
    try {
      const res = await fetch(`/api/personal_mantenimiento/reportes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      })
      const data = await res.json()
      if (data.success) {
        // Refresca la lista
        const condominioId = (report as any).condominioId ?? undefined;
        await (useAuxiliarTasksStore.getState() as any).fetchReports(report.auxiliarId, condominioId)
      }
    } catch {
      // Manejo de error opcional
    }
  },
  updateReport: async (id, updates) => {
    // Implementar PUT/PATCH en el endpoint si lo necesitas
  },
  deleteReport: async (id) => {
    // Implementar DELETE en el endpoint si lo necesitas
  },
}))
