"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User, ShoppingCart, ArrowLeft } from "lucide-react"
import { useAuthStore } from "@/lib/auth"

export default function FloatingNavBar() {
  const { isAuthenticated, isAdmin } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)
  const isHomePage = pathname === "/home"
  const isVigilantePage = pathname === "/vigilante" || pathname.startsWith("/vigilante/")

  // Don't show the navigation bar on login page, admin routes, or vigilante pages
  if (pathname === "/login" || isAdmin || pathname.startsWith("/admin") || isVigilantePage) {
    return null
  }

  const handleBackClick = () => {
    router.back()
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Barra de navegación principal */}
      <nav className="bg-[#d6b15e] py-4 px-6 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          {/* En la página principal, solo mostrar el icono de usuario */}
          {isHomePage ? (
            <Link href={isAuthenticated ? "/profile" : "/login"} className="flex flex-col items-center">
              <User className="h-6 w-6 text-[#0e2c52]" />
            </Link>
          ) : (
            /* En otras páginas, mostrar el botón de regreso */
            <button onClick={handleBackClick} className="flex items-center justify-center" aria-label="Regresar">
              <ArrowLeft className="h-6 w-6 text-[#0e2c52]" />
            </button>
          )}

          {/* Botón central */}
          <Link href="/home" className="flex items-center justify-center">
            <div className="bg-[#0e2c52] text-white rounded-full w-10 h-10 flex items-center justify-center">
              <span className="font-bold">P</span>
            </div>
          </Link>

          {/* Botón de carrito */}
          <Link href="/cart" className="flex items-center">
            <div className="relative">
              <ShoppingCart className="h-6 w-6 text-[#0e2c52]" />
              <span className="absolute -top-2 -right-2 bg-white text-[#0e2c52] text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  )
}
