import { create } from "zustand"

export type TaskStatus = "pending" | "in-progress" | "completed"
export type TaskPriority = "low" | "medium" | "high"

export interface AdminTask {
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
  completedBy?: string
  dueDate?: string
  department?: string
  category?: string
  comments?: AdminTaskComment[]
}

export interface AdminTaskComment {
  id: string
  taskId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

// Interfaz para reportes de tareas administrativas
export interface AdminTaskReport {
  userId: string
  userName: string
  completedTasks: number
  pendingTasks: number
  inProgressTasks: number
  totalTasks: number
  averageCompletionTime?: number // tiempo promedio de completado en días
  lastCompletedTask?: string // fecha de la última tarea completada
  tasks: {
    id: string
    title: string
    assignedAt: string
    completedAt?: string
    status: TaskStatus
    priority: TaskPriority
    timeToComplete?: number // tiempo en días
  }[]
}

interface AdminTasksState {
  tasks: AdminTask[]
  addTask: (task: Omit<AdminTask, "id" | "createdAt" | "updatedAt" | "comments">) => void
  updateTask: (id: string, updates: Partial<AdminTask>) => void
  completeTask: (id: string, userId: string, userName: string) => void
  deleteTask: (id: string) => void
  addComment: (taskId: string, userId: string, userName: string, content: string) => void
  getTasksByUser: (userId: string) => AdminTask[]
  getTaskReport: (userId?: string, startDate?: string, endDate?: string) => AdminTaskReport[]
}

export const useAdminTasksStore = create<AdminTasksState>((set, get) => ({
      tasks: [],
      addTask: (task) => {
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: `admin-task-${Date.now()}`,
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
      completeTask: (id, userId, userName) => {
        const now = new Date().toISOString()
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status: "completed",
                  completedAt: now,
                  completedBy: userId,
                  updatedAt: now,
                }
              : task,
          ),
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
      getTasksByUser: (userId) => {
        return get().tasks.filter((task) => task.assignedTo === userId)
      },
      getTaskReport: (userId, startDate, endDate) => {
        const tasks = get().tasks

        // Filtrar por fecha si se proporcionan fechas
        let filteredTasks = tasks
        if (startDate && endDate) {
          const start = new Date(startDate).getTime()
          const end = new Date(endDate).getTime()
          filteredTasks = tasks.filter((task) => {
            const taskDate = new Date(task.createdAt).getTime()
            return taskDate >= start && taskDate <= end
          })
        }

        // Si se proporciona un userId, devolver solo el reporte para ese usuario
        if (userId) {
          const userTasks = filteredTasks.filter((task) => task.assignedTo === userId)
          const completedTasks = userTasks.filter((task) => task.status === "completed")
          const pendingTasks = userTasks.filter((task) => task.status === "pending")
          const inProgressTasks = userTasks.filter((task) => task.status === "in-progress")

          // Calcular tiempo promedio de completado
          let averageCompletionTime = 0
          if (completedTasks.length > 0) {
            const completionTimes = completedTasks
              .filter((task) => task.completedAt)
              .map((task) => {
                const created = new Date(task.createdAt).getTime()
                const completed = new Date(task.completedAt!).getTime()
                return (completed - created) / (1000 * 60 * 60 * 24) // días
              })

            if (completionTimes.length > 0) {
              averageCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
            }
          }

          // Encontrar la última tarea completada
          let lastCompletedTask = undefined
          if (completedTasks.length > 0) {
            const sortedTasks = [...completedTasks].sort((a, b) => {
              return new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
            })
            lastCompletedTask = sortedTasks[0].completedAt
          }

          // Crear lista detallada de tareas para el reporte
          const taskDetails = userTasks.map((task) => {
            let timeToComplete = undefined
            if (task.completedAt) {
              const created = new Date(task.createdAt).getTime()
              const completed = new Date(task.completedAt).getTime()
              timeToComplete = (completed - created) / (1000 * 60 * 60 * 24) // días
            }

            return {
              id: task.id,
              title: task.title,
              assignedAt: task.createdAt,
              completedAt: task.completedAt,
              status: task.status,
              priority: task.priority,
              timeToComplete,
            }
          })

          return [
            {
              userId,
              userName: userTasks.length > 0 ? userTasks[0].assignedTo : userId,
              completedTasks: completedTasks.length,
              pendingTasks: pendingTasks.length,
              inProgressTasks: inProgressTasks.length,
              totalTasks: userTasks.length,
              averageCompletionTime,
              lastCompletedTask,
              tasks: taskDetails,
            },
          ]
        }

        // Si no se proporciona userId, agrupar por usuario
        const userIds = [...new Set(filteredTasks.map((task) => task.assignedTo))]

        return userIds.map((id) => {
          const userTasks = filteredTasks.filter((task) => task.assignedTo === id)
          const completedTasks = userTasks.filter((task) => task.status === "completed")
          const pendingTasks = userTasks.filter((task) => task.status === "pending")
          const inProgressTasks = userTasks.filter((task) => task.status === "in-progress")

          // Calcular tiempo promedio de completado
          let averageCompletionTime = 0
          if (completedTasks.length > 0) {
            const completionTimes = completedTasks
              .filter((task) => task.completedAt)
              .map((task) => {
                const created = new Date(task.createdAt).getTime()
                const completed = new Date(task.completedAt!).getTime()
                return (completed - created) / (1000 * 60 * 60 * 24) // días
              })

            if (completionTimes.length > 0) {
              averageCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
            }
          }

          // Encontrar la última tarea completada
          let lastCompletedTask = undefined
          if (completedTasks.length > 0) {
            const sortedTasks = [...completedTasks].sort((a, b) => {
              return new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
            })
            lastCompletedTask = sortedTasks[0].completedAt
          }

          // Crear lista detallada de tareas para el reporte
          const taskDetails = userTasks.map((task) => {
            let timeToComplete = undefined
            if (task.completedAt) {
              const created = new Date(task.createdAt).getTime()
              const completed = new Date(task.completedAt).getTime()
              timeToComplete = (completed - created) / (1000 * 60 * 60 * 24) // días
            }

            return {
              id: task.id,
              title: task.title,
              assignedAt: task.createdAt,
              completedAt: task.completedAt,
              status: task.status,
              priority: task.priority,
              timeToComplete,
            }
          })

          return {
            userId: id,
            userName: userTasks.length > 0 ? userTasks[0].assignedTo : id,
            completedTasks: completedTasks.length,
            pendingTasks: pendingTasks.length,
            inProgressTasks: inProgressTasks.length,
            totalTasks: userTasks.length,
            averageCompletionTime,
            lastCompletedTask,
            tasks: taskDetails,
          }
        })
      },
    }))
