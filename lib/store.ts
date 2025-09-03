import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"

export interface PetReport {
  id: string
  petName: string
  petType: string
  petBreed: string
  petColor: string
  characteristics: string
  lostDate: string
  lostTime: string
  lostLocation: string
  details: string
  contactName: string
  contactPhone: string
  contactEmail: string
  images: string[]
  createdAt: string
}

// Comercios cercanos: migrado a SQL y API; tipos removidos

// Historial de precios de mantenimiento
export interface MaintenancePriceHistory {
  id: string
  price: number
  effectiveDate: string
  createdBy: string
  createdAt: string
  notes?: string
}

// Actualizar la interfaz BankingDetails para eliminar el campo accountNumber
export interface BankingDetails {
  bankName: string
  accountHolder: string
  clabe: string
  reference?: string
  updatedAt: string
  updatedBy: string
}

// Interfaz para pagos de mantenimiento - Actualizada para solo usar transferencia y tarjeta
export interface MaintenancePayment {
  id: string
  userId: string
  userName: string
  amount: number
  paymentDate: string
  paymentMethod: "transfer" | "credit_card" // Actualizado: solo transferencia o tarjeta
  status: "pending" | "completed" | "rejected"
  receiptUrl?: string
  notes?: string
  month: number
  year: number
  createdAt: string
  updatedAt: string
  updatedBy?: string
  // Campos opcionales usados por las pantallas de pago y admin
  residentInfo?: any
  residentStatus?: string
  comments?: string
  trackingKey?: string
  breakdown?: any
}

// Nueva interfaz para tareas administrativas
export interface AdminTask {
  id: string
  title: string
  description?: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in-progress" | "completed"
  dueDate?: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// Actualizar la interfaz AppState para incluir datos bancarios
interface AppState {
  petReports: PetReport[]
  // Precio actual de mantenimiento
  maintenancePrice: number
  // Fecha límite de pago (día del mes)
  maintenanceDueDay: number
  // Recargo por pago tardío
  maintenanceLatePaymentFee: number
  // Historial de cambios de precio
  maintenancePriceHistory: MaintenancePriceHistory[]
  // Comercios cercanos: removido del store (se usa API)
  // Datos bancarios para pagos por transferencia
  bankingDetails: BankingDetails | null
  // Pagos de mantenimiento
  maintenancePayments: MaintenancePayment[]
  // Estado para tareas administrativas
  adminTasks: AdminTask[]
  addPetReport: (report: Omit<PetReport, "id" | "createdAt">) => string
  markNoticeAsRead: (id: string) => void
  deleteNotice: (id: string) => void
  // Notificaciones simples (no persistentes) para compatibilidad con pantallas existentes
  addNotice: (notice: { title: string; description: string; type: string }) => void
  getPetReportById: (id: string) => PetReport | undefined
  // Función para actualizar el precio de mantenimiento
  updateMaintenancePrice: (newPrice: number, userId: string, notes?: string) => void
  // Función para actualizar la fecha límite de pago
  updateMaintenanceDueDay: (newDueDay: number, userId: string, notes?: string) => void
  // Función para actualizar el recargo por pago tardío
  updateMaintenanceLatePaymentFee: (newFee: number, userId: string, notes?: string) => void
  // Comercios cercanos: funciones removidas
  // Función para actualizar datos bancarios
  updateBankingDetails: (details: Omit<BankingDetails, "updatedAt"> & { skipNotification?: boolean }) => void
  // Funciones para pagos de mantenimiento
  addMaintenancePayment: (payment: Omit<MaintenancePayment, "id" | "createdAt" | "updatedAt">) => string
  updateMaintenancePayment: (id: string, updatedPayment: Partial<Omit<MaintenancePayment, "id" | "createdAt">>) => void
  deleteMaintenancePayment: (id: string) => void
  getMaintenancePaymentsByUser: (userId: string) => MaintenancePayment[]
  getMaintenancePaymentsByMonth: (month: number, year: number) => MaintenancePayment[]
  addAdminTask: (task: Omit<AdminTask, "id" | "createdAt" | "completedAt">) => void
  updateAdminTask: (id: string, updates: Partial<AdminTask>) => void
  completeAdminTask: (id: string) => void
  deleteAdminTask: (id: string) => void
}

// Actualizar el estado inicial y las funciones
export const useAppStore = create<AppState>()((set, get) => ({
      petReports: [],
      // Precio inicial de mantenimiento
      maintenancePrice: 1500,
      // Día de pago predeterminado (día 10 de cada mes)
      maintenanceDueDay: 10,
      // Recargo por pago tardío predeterminado
      maintenanceLatePaymentFee: 200,
      // Historial de precios vacío inicialmente
      maintenancePriceHistory: [
        {
          id: `price-${Date.now()}`,
          price: 1500,
          effectiveDate: new Date().toISOString(),
          createdBy: "admin-1",
          createdAt: new Date().toISOString(),
          notes: "Precio inicial de mantenimiento",
        },
      ],
      // Datos bancarios iniciales (null)
      bankingDetails: null,
  // Comercios cercanos removidos del estado (usar API)
      // Pagos de mantenimiento iniciales (datos de ejemplo)
      maintenancePayments: [
        {
          id: "payment-1",
          userId: "user-1",
          userName: "Juan Pérez",
          amount: 1500,
          paymentDate: "2023-04-05T10:30:00.000Z",
          paymentMethod: "transfer",
          status: "completed",
          month: 4,
          year: 2023,
          createdAt: "2023-04-05T10:30:00.000Z",
          updatedAt: "2023-04-05T10:30:00.000Z",
        },
        {
          id: "payment-2",
          userId: "user-2",
          userName: "María López",
          amount: 1500,
          paymentDate: "2023-04-08T14:20:00.000Z",
          paymentMethod: "credit_card",
          status: "completed",
          month: 4,
          year: 2023,
          createdAt: "2023-04-08T14:20:00.000Z",
          updatedAt: "2023-04-08T14:20:00.000Z",
        },
        {
          id: "payment-3",
          userId: "user-3",
          userName: "Carlos Rodríguez",
          amount: 1700,
          paymentDate: "2023-04-12T09:15:00.000Z",
          paymentMethod: "transfer",
          status: "completed",
          notes: "Incluye recargo por pago tardío",
          month: 4,
          year: 2023,
          createdAt: "2023-04-12T09:15:00.000Z",
          updatedAt: "2023-04-12T09:15:00.000Z",
        },
        {
          id: "payment-4",
          userId: "user-1",
          userName: "Juan Pérez",
          amount: 1500,
          paymentDate: "2023-05-07T11:45:00.000Z",
          paymentMethod: "transfer",
          status: "completed",
          month: 5,
          year: 2023,
          createdAt: "2023-05-07T11:45:00.000Z",
          updatedAt: "2023-05-07T11:45:00.000Z",
        },
        {
          id: "payment-5",
          userId: "user-4",
          userName: "Ana Martínez",
          amount: 1500,
          paymentDate: "2023-05-09T16:30:00.000Z",
          paymentMethod: "credit_card",
          status: "completed",
          month: 5,
          year: 2023,
          createdAt: "2023-05-09T16:30:00.000Z",
          updatedAt: "2023-05-09T16:30:00.000Z",
        },
        {
          id: "payment-6",
          userId: "user-5",
          userName: "Roberto Gómez",
          amount: 1500,
          paymentDate: "2023-05-10T10:00:00.000Z",
          paymentMethod: "credit_card",
          status: "pending",
          month: 5,
          year: 2023,
          createdAt: "2023-05-10T10:00:00.000Z",
          updatedAt: "2023-05-10T10:00:00.000Z",
        },
        // Nuevo pago de ejemplo para probar el botón de acción
        {
          id: "payment-7",
          userId: "user-6",
          userName: "Laura Sánchez",
          amount: 1500,
          paymentDate: new Date().toISOString(),
          paymentMethod: "transfer",
          status: "pending",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      // Estado inicial para tareas administrativas
      adminTasks: [
        {
          id: "1",
          title: "Revisar solicitudes de mantenimiento",
          description: "Revisar y aprobar las solicitudes de mantenimiento pendientes",
          priority: "high",
          status: "pending",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Mañana
        },
        {
          id: "2",
          title: "Actualizar reglamento de áreas comunes",
          description: "Incorporar los cambios aprobados en la última junta directiva",
          priority: "medium",
          status: "in-progress",
          createdAt: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
          updatedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 604800000).toISOString(), // En una semana
        },
        {
          id: "3",
          title: "Enviar recordatorios de pago",
          description: "Enviar recordatorios a residentes con pagos pendientes",
          priority: "high",
          status: "completed",
          createdAt: new Date(Date.now() - 345600000).toISOString(), // Hace 4 días
          updatedAt: new Date().toISOString(),
          completedAt: new Date(Date.now() - 86400000).toISOString(), // Ayer
        },
        {
          id: "4",
          title: "Coordinar mantenimiento de jardines",
          description: "Programar el mantenimiento mensual de jardines y áreas verdes",
          priority: "medium",
          status: "pending",
          createdAt: new Date(Date.now() - 259200000).toISOString(), // Hace 3 días
          updatedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 345600000).toISOString(), // En 4 días
        },
        {
          id: "5",
          title: "Revisar presupuesto trimestral",
          description: "Analizar gastos del trimestre y preparar informe para residentes",
          priority: "low",
          status: "in-progress",
          createdAt: new Date(Date.now() - 432000000).toISOString(), // Hace 5 días
          updatedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 172800000).toISOString(), // En 2 días
        },
      ],

      addPetReport: (report) => {
        const id = `pet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const createdAt = new Date().toISOString()

        const newReport = {
          ...report,
          id,
          createdAt,
        }

        set((state) => ({
          petReports: [newReport, ...state.petReports],
        }))

        return id
      },


      markNoticeAsRead: (id) => {
      },

      deleteNotice: (id) => {
      },

  // No-op: solo para compatibilidad con pantallas que disparan notificaciones
  addNotice: (_notice) => {
  },

  // updateNotice removido (no utilizado)

      getPetReportById: (id) => {
        return get().petReports.find((report) => report.id === id)
      },

      // Función para actualizar el precio de mantenimiento
      updateMaintenancePrice: (newPrice, userId, notes) => {
        const id = `price-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date().toISOString()

        // Crear nuevo registro en el historial
        const newPriceRecord: MaintenancePriceHistory = {
          id,
          price: newPrice,
          effectiveDate: now,
          createdBy: userId,
          createdAt: now,
          notes: notes || `Actualización de precio de ${get().maintenancePrice} a ${newPrice}`,
        }

        // Actualizar el estado
        set((state) => ({
          maintenancePrice: newPrice,
          maintenancePriceHistory: [newPriceRecord, ...state.maintenancePriceHistory],
        }))

      },

      // Función para actualizar la fecha límite de pago
      updateMaintenanceDueDay: (newDueDay, userId, notes) => {
        const now = new Date().toISOString()

        // Validar que el día sea válido (entre 1 y 28)
        const validDueDay = Math.max(1, Math.min(28, newDueDay))

        // Actualizar el estado
        set((state) => ({
          maintenanceDueDay: validDueDay,
        }))

      },

      // Función para actualizar el recargo por pago tardío
      updateMaintenanceLatePaymentFee: (newFee, userId, notes) => {
        const now = new Date().toISOString()

        // Actualizar el estado
        set((state) => ({
          maintenanceLatePaymentFee: newFee,
        }))

      },

  // Funciones de comercios cercanos removidas (usar API)

      // Función para actualizar datos bancarios
      updateBankingDetails: (details: Omit<BankingDetails, "updatedAt"> & { skipNotification?: boolean }) => {
        const now = new Date().toISOString()

        set({
          bankingDetails: {
            ...details,
            updatedAt: now,
          },
        })

      },

      // Funciones para pagos de mantenimiento
      addMaintenancePayment: (payment) => {
        const id = `payment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date().toISOString()

        const newPayment = {
          ...payment,
          id,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          maintenancePayments: [...state.maintenancePayments, newPayment],
        }))

        return id
      },

      updateMaintenancePayment: (id, updatedPayment) => {
        const now = new Date().toISOString()

        set((state) => ({
          maintenancePayments: state.maintenancePayments.map((payment) =>
            payment.id === id
              ? {
                  ...payment,
                  ...updatedPayment,
                  updatedAt: now,
                }
              : payment,
          ),
        }))
      },

      deleteMaintenancePayment: (id) => {
        set((state) => ({
          maintenancePayments: state.maintenancePayments.filter((payment) => payment.id !== id),
        }))
      },

      getMaintenancePaymentsByUser: (userId) => {
        return get().maintenancePayments.filter((payment) => payment.userId === userId)
      },

      getMaintenancePaymentsByMonth: (month, year) => {
        return get().maintenancePayments.filter((payment) => payment.month === month && payment.year === year)
      },

      // Acciones para tareas administrativas
      addAdminTask: (task) =>
        set((state) => ({
          adminTasks: [
            ...state.adminTasks,
            {
              ...task,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      updateAdminTask: (id, updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          adminTasks: state.adminTasks.map((task) => (task.id === id ? { ...task, ...updates, updatedAt: now } : task)),
        }))
      },

      completeAdminTask: (id) => {
        const now = new Date().toISOString()
        set((state) => ({
          adminTasks: state.adminTasks.map((task) =>
            task.id === id
              ? { ...task, status: "completed", completedAt: new Date().toISOString(), updatedAt: now }
              : task,
          ),
        }))
      },

      deleteAdminTask: (id) =>
        set((state) => ({
          adminTasks: state.adminTasks.filter((task) => task.id !== id),
        })),
    }));
