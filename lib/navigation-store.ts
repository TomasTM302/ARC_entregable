"use client"

import { create } from "zustand"

interface NavigationState {
  previousPage: string | null
  setPreviousPage: (page: string) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  previousPage: null,
  setPreviousPage: (page) => set({ previousPage: page }),
}))
