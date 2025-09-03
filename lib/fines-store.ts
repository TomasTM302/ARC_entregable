import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"

export interface Fine {
  id: string
  userId: string
  userName: string
  userHouse: string
  reason: string
  amount: number
  status: "pending" | "paid" | "cancelled" | "overdue"
  createdAt: string
  dueDate: string
  lateFee: number
  isOverdue?: boolean
  currentAmount?: number
  paidAt?: string
  createdBy: string
  paymentId?: string // ID del pago que cubrió esta multa
}

interface FinesState {
  fines: Fine[]
  addFine: (fine: Omit<Fine, "id" | "createdAt" | "isOverdue" | "currentAmount">) => string
  updateFine: (id: string, updates: Partial<Fine>) => void
  deleteFine: (id: string) => void
  getFinesByUser: (userId: string) => Fine[]
  getPendingFinesByUser: (userId: string) => Fine[]
  markFineAsPaid: (fineId: string, paymentId: string) => void
  updateFinesStatus: () => void
}

export const useFinesStore = create<FinesState>((set, get) => ({
      fines: [],

      addFine: (fine) => {
        const id = uuidv4()
        const createdAt = new Date().toISOString()

        const newFine: Fine = {
          ...fine,
          id,
          createdAt,
        }

        set((state) => ({
          fines: [newFine, ...state.fines],
        }))

        // Actualizar el estado de las multas después de agregar
        get().updateFinesStatus()

        return id
      },

      updateFine: (id, updates) => {
        set((state) => ({
          fines: state.fines.map((fine) => (fine.id === id ? { ...fine, ...updates } : fine)),
        }))
      },

      deleteFine: (id) => {
        set((state) => ({
          fines: state.fines.filter((fine) => fine.id !== id),
        }))
      },

      getFinesByUser: (userId) => {
        return get().fines.filter((fine) => fine.userId === userId)
      },

      getPendingFinesByUser: (userId) => {
        const userFines = get().fines.filter((fine) => fine.userId === userId)
        return userFines.filter((fine) => fine.status === "pending" || fine.status === "overdue")
      },

      markFineAsPaid: (fineId, paymentId) => {
        set((state) => ({
          fines: state.fines.map((fine) =>
            fine.id === fineId
              ? {
                  ...fine,
                  status: "paid" as const,
                  paidAt: new Date().toISOString(),
                  paymentId,
                }
              : fine,
          ),
        }))
      },

      updateFinesStatus: () => {
        const today = new Date()

        set((state) => ({
          fines: state.fines.map((fine) => {
            const dueDate = new Date(fine.dueDate)
            const isOverdue = fine.status === "pending" && today > dueDate
            const currentAmount = isOverdue ? fine.amount + fine.lateFee : fine.amount

            return {
              ...fine,
              status: isOverdue ? ("overdue" as const) : fine.status,
              isOverdue,
              currentAmount,
            }
          }),
        }))
      },
    }))
