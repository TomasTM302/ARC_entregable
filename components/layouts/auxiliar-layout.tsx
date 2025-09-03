"use client"

import type React from "react"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import { ClipboardList, FileText, User, LogOut } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function AuxiliarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user, isAuthenticated, isMantenimiento } = useAuthStore()
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    } else if (!isMantenimiento) {
      router.push("/home")
    }
  }, [isAuthenticated, isMantenimiento, router])

  // No mostrar el layout de auxiliar para páginas que no son de auxiliar
  if (!pathname.startsWith("/auxiliar")) {
    return <div className="min-h-screen">{children}</div>
  }

  if (!isAuthenticated || !isMantenimiento) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header con título */}
      <header className="bg-[#0e2c52] text-white py-3 px-4">
        <h1 className="text-xl font-bold">Panel Mantenimiento</h1>
      </header>

      {/* Menú superior */}
      <nav className="bg-[#0e2c52] text-white border-t border-[#1a4580] shadow-md">
        <div className="flex">
          <NavLink
            href="/auxiliar"
            icon={<ClipboardList size={18} />}
            label="Mis Tareas"
            isActive={pathname === "/auxiliar"}
          />
          <NavLink
            href="/auxiliar/reportes"
            icon={<FileText size={18} />}
            label="Mis Reportes"
            isActive={pathname === "/auxiliar/reportes"}
          />
          <NavLink
            href="/auxiliar/perfil"
            icon={<User size={18} />}
            label="Mi Perfil"
            isActive={pathname === "/auxiliar/perfil"}
          />
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 py-3 px-4 text-white hover:bg-[#1a4580] transition-colors ml-auto"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="flex-1 p-4 pb-16">{children}</main>

      {/* Footer móvil */}
      {isMobile && (
        <footer className="fixed bottom-0 left-0 right-0 bg-[#0e2c52] border-t border-[#1a4580] py-2 px-4 z-10">
          <div className="flex justify-around items-center">
            <Link
              href="/auxiliar"
              className={`flex flex-col items-center ${pathname === "/auxiliar" ? "text-white" : "text-gray-400"}`}
            >
              <ClipboardList size={24} />
              <span className="text-xs font-medium mt-1">Tareas</span>
            </Link>

            <Link
              href="/auxiliar/reportes"
              className={`flex flex-col items-center ${
                pathname === "/auxiliar/reportes" ? "text-white" : "text-gray-400"
              }`}
            >
              <FileText size={24} />
              <span className="text-xs font-medium mt-1">Reportes</span>
            </Link>

            <Link
              href="/auxiliar/perfil"
              className={`flex flex-col items-center ${pathname === "/auxiliar/perfil" ? "text-white" : "text-gray-400"}`}
            >
              <User size={24} />
              <span className="text-xs font-medium mt-1">Perfil</span>
            </Link>
          </div>
        </footer>
      )}
    </div>
  )
}

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}

function NavLink({ href, icon, label, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 py-3 px-4 ${
        isActive ? "bg-[#1a4580] text-white" : "text-white hover:bg-[#1a4580]"
      } transition-colors`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
