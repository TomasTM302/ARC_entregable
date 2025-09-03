"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import MobileFooter from "@/components/layouts/mobile-footer"

interface MobileLayoutProps {
  children: ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, user, isMantenimiento } = useAuthStore()

  // Determine if we should show header/footer based on path
  const isLoginPage = pathname === "/login" || pathname === "/register"
  const isHomePage = pathname === "/home"

  return (
    <div className="flex flex-col min-h-screen bg-[#0e2c52] w-full overflow-x-hidden">
      {/* Barra de navegación minimalista para reemplazar el header */}
      {/* La barra de navegación minimalista ha sido eliminada */}

      <main className="flex-grow pb-16 w-full">
        <div className="w-full">{children}</div>
      </main>

      {isAuthenticated && !isLoginPage && <MobileFooter />}
    </div>
  )
}
