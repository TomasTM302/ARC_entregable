"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth"

// Lista de rutas públicas que no requieren autenticación
const PUBLIC_PATHS = ["/", "/login", "/register", "/proveedores"]

export default function AuthRedirect() {
  const { isAuthenticated, isVigilante, isMantenimiento, isRestoring, restore } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Intentar restaurar sesión al montar
    restore()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
  // Evitar redirecciones mientras se restaura
  if (isRestoring) return

  // Si el usuario no está autenticado y no está en una ruta pública, redirigir a login
    if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    if (isAuthenticated && pathname === "/login") {
      router.push("/home")
      return
    }

    // Si el usuario está autenticado como vigilante y no está en el dashboard de vigilante, redirigir allí
    if (isAuthenticated && isVigilante && pathname !== "/vigilante" && !pathname.startsWith("/vigilante/")) {
      router.push("/vigilante")
      return
    }

    // Si el usuario está autenticado como mantenimiento y no está en el dashboard de mantenimiento, redirigir allí
    if (isAuthenticated && isMantenimiento && pathname !== "/mantenimiento" && !pathname.startsWith("/mantenimiento/")) {
      router.push("/mantenimiento")
      return
    }

    // Si el usuario está autenticado como residente o admin y está en la raíz, redirigir al home
    if (
      isAuthenticated &&
      !isVigilante &&
      !isMantenimiento &&
      pathname === "/"
    ) {
      router.push("/home")
      return
    }

    // Si el usuario está autenticado como residente o admin e intenta acceder a páginas de vigilante, redirigir a home
    if (isAuthenticated && !isVigilante && (pathname === "/vigilante" || pathname.startsWith("/vigilante/"))) {
      router.push("/home")
      return
    }

    // Si el usuario está autenticado como residente o admin e intenta acceder a páginas de mantenimiento, redirigir a home
    if (isAuthenticated && !isMantenimiento && (pathname === "/mantenimiento" || pathname.startsWith("/mantenimiento/"))) {
      router.push("/home")
      return
    }
  }, [isAuthenticated, isVigilante, isMantenimiento, isRestoring, pathname, router])

  return null
}
