"use client"

import type React from "react"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useAuthStore } from "@/lib/auth"
import Link from "next/link"
import {
  Home,
  Settings,
  FileText,
  Users,
  CreditCard,
  LogOut,
  Menu,
  X,
  CheckSquare,
  ArrowLeft,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface DesktopLayoutProps {
  children: ReactNode
}

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  const pathname = usePathname()
  const { isAuthenticated, isAdmin, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Don't show admin layout for non-admin pages
  if (!isAdmin || !pathname.startsWith("/admin")) {
    return <div className="min-h-screen">{children}</div>
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={cn(
          "bg-[#0e2c52] text-white transition-all duration-300 ease-in-out fixed h-screen z-10",
          sidebarOpen ? "w-64" : "w-20",
        )}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <Link href="/admin" className="flex items-center">
                <span className="font-bold text-xl">Admin</span>
              </Link>
              <button onClick={toggleSidebar} className="p-1">
                <X size={20} />
              </button>
            </>
          ) : (
            <button onClick={toggleSidebar} className="p-1 mx-auto">
              <Menu size={20} />
            </button>
          )}
        </div>

        <nav className="mt-8">
          <AdminNavLink
            href="/admin"
            icon={<Home size={20} />}
            label="Dashboard"
            isActive={pathname === "/admin"}
            expanded={sidebarOpen}
          />
          <AdminNavLink
            href="/admin/multas"
            icon={<FileText size={20} />}
            label="Multas"
            isActive={pathname.startsWith("/admin/multas")}
            expanded={sidebarOpen}
          />
          <AdminNavLink
            href="/admin/convenios"
            icon={<FileText size={20} />}
            label="Convenios"
            isActive={pathname.startsWith("/admin/convenios")}
            expanded={sidebarOpen}
          />
          <AdminNavLink
            href="/admin/mantenimiento"
            icon={<CreditCard size={20} />}
            label="Mantenimiento"
            isActive={pathname.startsWith("/admin/mantenimiento")}
            expanded={sidebarOpen}
          />
          <AdminNavLink
            href="/admin/comercios"
            icon={<Settings size={20} />}
            label="Comercios"
            isActive={pathname.startsWith("/admin/comercios")}
            expanded={sidebarOpen}
          />
          <AdminNavLink
            href="/admin/usuarios"
            icon={<Users size={20} />}
            label="Usuarios"
            isActive={pathname.startsWith("/admin/usuarios")}
            expanded={sidebarOpen}
          />
          <AdminNavLink
            href="/admin/tareas"
            icon={<CheckSquare size={20} />}
            label="Tareas"
            isActive={pathname.startsWith("/admin/tareas")}
            expanded={sidebarOpen}
          />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
          <Link href="/home" className="flex items-center text-white hover:text-blue-300 transition-colors">
            <ArrowLeft size={20} className="mr-2" />
            {sidebarOpen && <span>Volver al inicio</span>}
          </Link>
          <button onClick={logout} className="flex items-center text-white hover:text-red-300 transition-colors">
            <LogOut size={20} className="mr-2" />
            {sidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 bg-[#0e2c52] overflow-hidden transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-20",
        )}
      >
        <header className="bg-[#0e2c52] text-white p-4 border-b border-[#1a4580]">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-white">
              {pathname === "/admin" && "Dashboard"}
              {pathname.startsWith("/admin/multas") && "Gestión de Multas"}
              {pathname.startsWith("/admin/convenios") && "Gestión de Convenios"}
              {pathname.startsWith("/admin/mantenimiento") && "Configuración de Mantenimiento"}
              {pathname.startsWith("/admin/comercios") && "Gestión de Comercios"}
              {pathname.startsWith("/admin/usuarios") && "Gestión de Usuarios"}
              {pathname.startsWith("/admin/tareas") && "Gestión de Tareas"}
            </h1>
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#d6b15e] rounded-full flex items-center justify-center text-white">A</div>
                {sidebarOpen && <span className="ml-2 font-medium">Administrador</span>}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 bg-[#0e2c52] min-h-[calc(100vh-64px)]">{children}</main>
      </div>
    </div>
  )
}

interface AdminNavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  expanded: boolean
}

function AdminNavLink({ href, icon, label, isActive, expanded }: AdminNavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center py-3 px-4 ${
        isActive ? "bg-[#1a4580] text-white" : "text-gray-300 hover:bg-[#1a4580] hover:text-white"
      } transition-colors`}
    >
      <div className={expanded ? "mr-3" : "mx-auto"}>{icon}</div>
      {expanded && <span>{label}</span>}
    </Link>
  )
}
