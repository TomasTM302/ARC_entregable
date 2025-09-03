import { create } from "zustand"

export interface Visitor {
  id: string
  name: string
  phone: string
  visitDate: string
  entryTime: string
  destination: string
  companions: string
  photoUrl?: string
  qrCode?: string
  createdAt: string
  status: "pending" | "approved" | "denied" | "completed"
}

interface VisitorState {
  visitors: Visitor[]
  addVisitor: (visitor: Omit<Visitor, "id" | "createdAt" | "status">) => string
  getVisitorByQrData: (qrData: string) => Visitor | undefined
  updateVisitorStatus: (id: string, status: Visitor["status"]) => void
  getVisitors: () => Visitor[]
}

// Mock visitors for demonstration
const initialVisitors: Visitor[] = []

export const useVisitorStore = create<VisitorState>((set, get) => ({
      visitors: initialVisitors,

      addVisitor: (visitorData) => {
        const id = `visitor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

        // Generate QR data
        const companions = visitorData.companions ? `\nACOMPAÑANTES: ${visitorData.companions}` : ""
        const qrCode = `NOMBRE: ${visitorData.name}\nTELÉFONO: ${visitorData.phone}\nFECHA: ${visitorData.visitDate}\nHORA: ${visitorData.entryTime}\nDIRECCIÓN: ${visitorData.destination}${companions}`

        const newVisitor: Visitor = {
          ...visitorData,
          id,
          qrCode,
          createdAt: new Date().toISOString(),
          status: "pending",
        }

        set((state) => ({
          visitors: [...state.visitors, newVisitor],
        }))

        return id
      },

      getVisitorByQrData: (qrData) => {
        return get().visitors.find((visitor) => visitor.qrCode === qrData)
      },

      updateVisitorStatus: (id, status) => {
        set((state) => ({
          visitors: state.visitors.map((visitor) => (visitor.id === id ? { ...visitor, status } : visitor)),
        }))
      },

      getVisitors: () => {
        return get().visitors
      },
    }))
