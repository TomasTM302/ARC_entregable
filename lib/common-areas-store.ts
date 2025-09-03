import { create } from "zustand"

export interface CommonArea {
  id: string
  name: string
  description: string
  type: "common" | "private"
  icon: string
  deposit: number
  operatingHours: string
  maxDuration: number
  maxPeople: number
  isActive: boolean
  details?: string[]
  maxAdvanceBookingDays: number
  maxSimultaneousBookings?: number
  currentBookings?: number
}

interface CommonAreasState {
  areas: CommonArea[]
  getAreaById: (id: string) => CommonArea | undefined
  updateArea: (id: string, updates: Partial<CommonArea>) => void
  toggleAreaStatus: (id: string) => void
  addArea: (area: CommonArea) => void
  removeArea: (id: string) => void
}

export const useCommonAreasStore = create<CommonAreasState>((set, get) => ({
      areas: [],

      getAreaById: (id) => {
        return get().areas.find((area) => area.id === id)
      },

      updateArea: (id, updates) => {
        set((state) => ({
          areas: state.areas.map((area) => (area.id === id ? { ...area, ...updates } : area)),
        }))
      },

      toggleAreaStatus: (id) => {
        set((state) => ({
          areas: state.areas.map((area) => (area.id === id ? { ...area, isActive: !area.isActive } : area)),
        }))
      },

      addArea: (area) => {
        set((state) => ({
          areas: [...state.areas, area],
        }))
      },

      removeArea: (id) => {
        set((state) => ({
          areas: state.areas.filter((area) => area.id !== id),
        }))
      },
    }))
