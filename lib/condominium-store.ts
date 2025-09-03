import { create } from "zustand"

export interface Condominium {
  id: string
  name: string
  address: string
  totalUnits: number
  imageUrl?: string
  createdAt: string
}

export interface CondominiumActivity {
  id: string
  condominiumId: string
  title: string
  description: string
  status: "pending" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  createdAt: string
  completedAt?: string
  assignedTo?: string
  images?: string[]
}

interface CondominiumState {
  condominiums: Condominium[]
  activities: CondominiumActivity[]
  getCondominiumById: (id: string) => Condominium | undefined
  getActivitiesByCondominiumId: (condominiumId: string) => CondominiumActivity[]
  addActivity: (activity: Omit<CondominiumActivity, "id" | "createdAt">) => string
  updateActivityStatus: (id: string, status: CondominiumActivity["status"], completedAt?: string) => void
}

export const useCondominiumStore = create<CondominiumState>((set, get) => ({
      condominiums: [],
      activities: [],
      getCondominiumById: (id) => {
        return get().condominiums.find((condo) => condo.id === id)
      },
      getActivitiesByCondominiumId: (condominiumId) => {
        return get().activities.filter((activity) => activity.condominiumId === condominiumId)
      },
      addActivity: (activity) => {
        const id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const newActivity = {
          ...activity,
          id,
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          activities: [newActivity, ...state.activities],
        }))

        return id
      },
      updateActivityStatus: (id, status, completedAt) => {
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id
              ? {
                  ...activity,
                  status,
                  completedAt: status === "completed" ? completedAt || new Date().toISOString() : activity.completedAt,
                }
              : activity,
          ),
        }))
      },
    }))
