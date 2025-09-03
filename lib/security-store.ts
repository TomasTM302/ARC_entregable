import { create } from "zustand"

export interface SecurityAlert {
  id: string
  houseId: string
  userId: string
  message: string
  createdAt: string
  attended: boolean
  attendedAt?: string
  attendedBy?: string
}

interface SecurityState {
  securityAlerts: SecurityAlert[]
  createSecurityAlert: (alert: Omit<SecurityAlert, "id" | "createdAt" | "attended">) => string
  markAlertAsAttended: (alertId: string, attendedBy?: string) => void
  getActiveAlerts: () => SecurityAlert[]
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
      securityAlerts: [],

      createSecurityAlert: (alert) => {
        const id = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const createdAt = new Date().toISOString()

        const newAlert = {
          ...alert,
          id,
          createdAt,
          attended: false,
        }

        set((state) => ({
          securityAlerts: [newAlert, ...state.securityAlerts],
        }))

        return id
      },

      markAlertAsAttended: (alertId, attendedBy) => {
        const now = new Date().toISOString()

        set((state) => ({
          securityAlerts: state.securityAlerts.map((alert) =>
            alert.id === alertId
              ? {
                  ...alert,
                  attended: true,
                  attendedAt: now,
                  attendedBy: attendedBy || "unknown",
                }
              : alert,
          ),
        }))
      },

      getActiveAlerts: () => {
        return get().securityAlerts.filter((alert) => !alert.attended)
      },
    }))
