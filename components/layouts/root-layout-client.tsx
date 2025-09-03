"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useDevice } from "@/hooks/use-device"
import { useAuthStore } from "@/lib/auth"
import MobileLayout from "@/components/layouts/mobile-layout"
import DesktopLayout from "@/components/layouts/desktop-layout"
import VigilanteLayout from "@/components/layouts/vigilante-layout"

interface RootLayoutClientProps {
  children: ReactNode
}

// Asegurar que el contenedor raíz ocupe todo el ancho disponible
export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  const { isMobile, isTablet } = useDevice()
  const pathname = usePathname()
  const { isAdmin, isVigilante, isMantenimiento, isRestoring } = useAuthStore()

  // Mostrar loader durante la restauración de sesión para evitar parpadeos/redirects prematuros
  if (isRestoring) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0e2c52] text-white">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.372 0 0 5.373 0 12h4z" />
          </svg>
          <p>Restaurando sesión…</p>
        </div>
      </div>
    )
  }

  // Special case for vigilante pages
  if (isVigilante || pathname.startsWith("/vigilante")) {
    return <VigilanteLayout>{children}</VigilanteLayout>
  }

  // Special case for mantenimiento pages
  if (isMantenimiento || pathname.startsWith("/mantenimiento")) {
    return <MobileLayout>{children}</MobileLayout>
  }

  // For admin pages on desktop, use desktop layout
  if (isAdmin && pathname.startsWith("/admin") && !isMobile && !isTablet) {
    return <DesktopLayout>{children}</DesktopLayout>
  }

  // For mobile devices or non-admin pages
  if (isMobile || isTablet) {
    return <MobileLayout>{children}</MobileLayout>
  }

  // Default desktop layout for other cases
  return <DesktopLayout>{children}</DesktopLayout>
}
