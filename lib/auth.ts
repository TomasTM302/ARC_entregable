import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type UserRole = "admin" | "resident" | "vigilante" | "mantenimiento"

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  house: string
  condominiumId: string
  role: UserRole
  createdAt: string
}

interface Credentials {
  email: string
  password: string
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  phone: string
  house: string
  condominiumId: string
  password: string
  role: UserRole
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isVigilante: boolean
  isMantenimiento: boolean
  isRestoring: boolean
  rememberMe: boolean
  users: User[]
  login: (credentials: Credentials) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void> | void
  restore: () => Promise<void>
  setRememberMe: (value: boolean) => void
  fetchUsers: (role?: UserRole | 'all') => Promise<void>
  getUsers: () => User[]
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>
  deleteUser: (id: string) => Promise<{ success: boolean; message?: string }>
  resetStore: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isVigilante: false,
      isMantenimiento: false,
      isRestoring: true,
      rememberMe: false,
      users: [],

  login: async (credentials: Credentials) => {
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          })

          const data = await res.json()
          if (!res.ok || !data.success) {
            return { success: false, message: data.message || 'Credenciales incorrectas' }
          }

          const { user, token } = data
          set({
            user,
            token,
            isAuthenticated: true,
            isAdmin: user.role === 'admin',
            isVigilante: user.role === 'vigilante',
            isMantenimiento: user.role === 'mantenimiento',
            isRestoring: false,
          })

          return { success: true }
        } catch (err) {
          console.error(err)
          return { success: false, message: 'Error de servidor' }
        }
      },

      logout: async () => {
        try { await fetch('/api/logout', { method: 'POST' }) } catch {}
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
          isVigilante: false,
          isMantenimiento: false,
          isRestoring: false,
        })
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      },

      restore: async () => {
        try {
          set({ isRestoring: true })
          const res = await fetch('/api/auth/session', { cache: 'no-store' })
          const data = await res.json()
          if (data?.authenticated) {
            if (!get().isAuthenticated) {
              try {
                const r = await fetch('/api/auth/me', { cache: 'no-store' })
                const j = await r.json()
                if (r.ok && j?.success && j.user) {
                  const u = j.user
                  set({
                    user: u,
                    isAuthenticated: true,
                    isAdmin: u.role === 'admin',
                    isVigilante: u.role === 'vigilante',
                    isMantenimiento: u.role === 'mantenimiento',
                    isRestoring: false,
                  })
                } else {
                  set({ isAuthenticated: true, isRestoring: false })
                }
              } catch {
                set({ isAuthenticated: true, isRestoring: false })
              }
            } else {
              set({ isRestoring: false })
            }
          } else {
            set({ isRestoring: false })
          }
        } catch {
          set({ isRestoring: false })
        }
      },

      setRememberMe: (value: boolean) => {
        set({ rememberMe: value })
      },

      fetchUsers: async (role: UserRole | 'all' = 'all') => {
        try {
          const params = new URLSearchParams()
          if (role && role !== 'all') {
            params.set('role', role)
          }
          const url = params.size > 0 ? `/api/users?${params.toString()}` : '/api/users'
          const res = await fetch(url)
          const data = await res.json()
          if (res.ok && data.success) {
            set({ users: data.users })
          }
        } catch (err) {
          console.error(err)
        }
      },

  getUsers: () => (get() as unknown as AuthState).users,

      register: async (data: RegisterData) => {
        try {
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          const result = await res.json()
          if (res.ok && result.success) {
            set({ users: [...(get() as unknown as AuthState).users, result.user] })
            return { success: true }
          }
          return { success: false, message: result.message || 'Error al registrar' }
        } catch (err) {
          console.error(err)
          return { success: false, message: 'Error de servidor' }
        }
      },

      deleteUser: async (id: string) => {
        try {
          const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
          const data = await res.json()
          if (res.ok && data.success) {
            set({ users: (get() as unknown as AuthState).users.filter((u: User) => u.id !== id) })
            return { success: true }
          }
          return { success: false, message: data.message || 'Error al eliminar' }
        } catch (err) {
          console.error(err)
          return { success: false, message: 'Error de servidor' }
        }
      },

      resetStore: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isAdmin: false,
          isVigilante: false,
          isMantenimiento: false,
          isRestoring: false,
          rememberMe: false,
          users: [],
        })
      },
    }),
    {
      name: 'arc-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : undefined as any)),
  partialize: (state: AuthState) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
        isVigilante: state.isVigilante,
        isMantenimiento: state.isMantenimiento,
        isRestoring: state.isRestoring,
        rememberMe: state.rememberMe,
      }),
    }
  )
)
