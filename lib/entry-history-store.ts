import { create } from "zustand"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export interface EntryRecord {
  id: string
  visitorName: string
  destination: string
  entryTime: string
  companions: number
  phoneNumber?: string
  vehicle?: {
    plate: string
    model: string
  }
}

interface EntryHistoryState {
  entries: EntryRecord[]
  addEntry: (entry: Omit<EntryRecord, "id" | "entryTime">) => void
  clearEntries: () => void
}

export const useEntryHistoryStore = create<EntryHistoryState>((set) => ({
  entries: [
    {
      id: "1",
      visitorName: "Juan Pérez",
      destination: "Casa 123",
      entryTime: format(new Date(2023, 5, 15, 14, 30), "dd/MM/yyyy HH:mm", { locale: es }),
      companions: 2,
      phoneNumber: "555-123-4567",
      vehicle: {
        plate: "ABC-123",
        model: "Honda Civic",
      },
    },
    {
      id: "2",
      visitorName: "María González",
      destination: "Casa 456",
      entryTime: format(new Date(2023, 5, 15, 15, 45), "dd/MM/yyyy HH:mm", { locale: es }),
      companions: 0,
      phoneNumber: "555-987-6543",
    },
    {
      id: "3",
      visitorName: "Carlos Rodríguez",
      destination: "Casa 789",
      entryTime: format(new Date(2023, 5, 15, 16, 20), "dd/MM/yyyy HH:mm", { locale: es }),
      companions: 3,
      phoneNumber: "555-456-7890",
      vehicle: {
        plate: "XYZ-789",
        model: "Toyota Corolla",
      },
    },
    {
      id: "4",
      visitorName: "Ana Martínez",
      destination: "Casa 234",
      entryTime: format(new Date(2023, 5, 15, 17, 10), "dd/MM/yyyy HH:mm", { locale: es }),
      companions: 1,
      phoneNumber: "555-234-5678",
    },
    {
      id: "5",
      visitorName: "Roberto Sánchez",
      destination: "Casa 567",
      entryTime: format(new Date(2023, 5, 15, 18, 5), "dd/MM/yyyy HH:mm", { locale: es }),
      companions: 0,
      phoneNumber: "555-345-6789",
      vehicle: {
        plate: "DEF-456",
        model: "Nissan Sentra",
      },
    },
  ],
  addEntry: (entry) =>
    set((state) => ({
      entries: [
        {
          id: Math.random().toString(36).substring(2, 9),
          entryTime: format(new Date(), "dd/MM/yyyy HH:mm", { locale: es }),
          ...entry,
        },
        ...state.entries,
      ],
    })),
  clearEntries: () => set({ entries: [] }),
}))
