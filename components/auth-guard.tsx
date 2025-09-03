"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth"

type UserRole = string

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  requireVigilante?: boolean
  requireMantenimiento?: boolean
  requireRole?: UserRole
}

export default function AuthGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
  requireVigilante = false,
  requireMantenimiento = false,
  requireRole,
}: AuthGuardProps) {
  const { isAuthenticated, isAdmin, isVigilante, isMantenimiento, isRestoring, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState(true)

  useEffect(() => {
    // Evitar redirecciones mientras se restaura la sesión
    if (isRestoring) {
      setIsAuthorized(false)
      return
    }

    // Siempre permitir acceso a la página de vigilante sin autenticación
    if (pathname.startsWith("/vigilante")) {
      setIsAuthorized(true)
      return
    }

    // Si authentication es requerida y el usuario no está autenticado
    if (requireAuth && !isAuthenticated) {
      // No redirigir a login si estamos intentando acceder a /vigilante
      if (!pathname.startsWith("/vigilante")) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }
    }

    // Si se requieren privilegios de admin y el usuario no es admin
    if (requireAdmin && !isAdmin) {
      router.push("/home")
      return
    }

    // Si se requieren privilegios de vigilante y el usuario no es vigilante
    if (requireVigilante && !isVigilante && !pathname.startsWith("/vigilante")) {
      router.push("/home")
      return
    }

    // Si se requieren privilegios de mantenimiento y el usuario no es mantenimiento
    if (requireMantenimiento && !isMantenimiento) {
      router.push("/home")
      return
    }

    // Si se requiere un rol específico y el usuario no tiene ese rol
    if (requireRole && user?.role !== requireRole) {
      router.push("/home")
      return
    }

    setIsAuthorized(true)
  }, [
    isAuthenticated,
    isAdmin,
    isVigilante,
  isMantenimiento,
  isRestoring,
    requireAuth,
    requireAdmin,
    requireVigilante,
    requireMantenimiento,
    requireRole,
    router,
    pathname,
    user?.role,
  ])

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
