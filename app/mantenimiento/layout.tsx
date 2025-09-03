"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { LogOut, User, Plus, ClipboardList, Building2 } from "lucide-react"
import NewReportModal from "@/components/mantenimiento/new-report-modal"

export default function MantenimientoLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isMantenimiento, logout, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    } else if (!isMantenimiento) {
      router.push("/home")
    }
  }, [isAuthenticated, isMantenimiento, router])

  // No mostrar el layout de mantenimiento para páginas que no son de mantenimiento
  if (!pathname.startsWith("/mantenimiento")) {
    return <div className="min-h-screen">{children}</div>
  }

  if (!isAuthenticated || !isMantenimiento) {
    return null
  }

  const handleNewActivity = () => {
    setIsNewReportModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header con título */}
      <header className="bg-[#0e2c52] text-white py-3 px-4">
        <h1 className="text-xl font-bold">Panel Mantenimiento</h1>
      </header>

      {/* Navbar superior */}
      <nav className="bg-[#0e2c52] text-white border-t border-[#1a4580] shadow-md sticky top-0 z-30 hidden md:block">
        <div className="flex flex-wrap">
          <Link
            href="/mantenimiento"
            className={`flex items-center py-3 px-4 ${
              pathname === "/mantenimiento" || pathname === "/mantenimiento"
                ? "bg-[#1a4580] text-white"
                : "text-gray-300 hover:bg-[#1a4580] hover:text-white"
            } transition-colors`}
          >
            <Building2 className="mr-2 h-5 w-5" />
            <span>Condominios</span>
          </Link>
          <Link
            href="/mantenimiento/reportes"
            className={`flex items-center py-3 px-4 ${
              pathname === "/mantenimiento/reportes"
                ? "bg-[#1a4580] text-white"
                : "text-gray-300 hover:bg-[#1a4580] hover:text-white"
            } transition-colors`}
          >
            <ClipboardList className="mr-2 h-5 w-5" />
            <span>Mis Actividades</span>
          </Link>
          <Link
            href="/mantenimiento/perfil"
            className={`flex items-center py-3 px-4 ${
              pathname === "/mantenimiento/perfil"
                ? "bg-[#1a4580] text-white"
                : "text-gray-300 hover:bg-[#1a4580] hover:text-white"
            } transition-colors`}
          >
            <User className="mr-2 h-5 w-5" />
            <span>Mi Perfil</span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center py-3 px-4 ml-auto text-gray-300 hover:bg-[#1a4580] hover:text-white transition-colors"
          >
            <LogOut className="mr-2 h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>

      {/* Contenido principal - ahora ocupa todo el ancho */}
      <main className="flex-1 p-6 pb-16 md:pb-6">{children}</main>

      {/* Barra de navegación inferior para móviles - Diseño estilizado */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pb-3">
        <div className="relative flex items-center justify-between bg-gray-200 rounded-full px-8 py-2 shadow-lg">
          {/* Botón Condominios (vista principal) */}
          <Link
            href="/mantenimiento"
            className={`flex flex-col items-center ${
              pathname === "/mantenimiento" || pathname === "/mantenimiento"
                ? "text-[#0e2c52] font-medium"
                : "text-gray-600"
            }`}
          >
            <Building2 className="h-6 w-6" />
            <span className="text-xs mt-1">Condominios</span>
          </Link>

          {/* Espacio para el botón central */}
          <div className="w-16"></div>

          {/* Botón de cerrar sesión */}
          <button onClick={logout} className="flex flex-col items-center text-gray-600">
            <LogOut className="h-6 w-6" />
            <span className="text-xs mt-1">Salir</span>
          </button>

          {/* Botón central con signo + (ahora abre el modal de nueva actividad) */}
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/3">
            <button
              onClick={handleNewActivity}
              className="flex items-center justify-center w-[5.25rem] h-[5.25rem] rounded-full bg-black text-white shadow-lg"
            >
              <Plus className="h-12 w-12" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal para nueva actividad */}
      <NewReportModal isOpen={isNewReportModalOpen} onClose={() => setIsNewReportModalOpen(false)} />
    </div>
  )
}
