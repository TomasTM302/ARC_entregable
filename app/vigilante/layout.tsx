"use client"

import type React from "react"

import { useAuthStore } from "@/lib/auth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardList, ScanLine, LogOut, X, Menu } from "lucide-react"

export default function VigilanteLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isVigilante, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    } else if (!isVigilante) {
      router.push("/home")
    }
  }, [isAuthenticated, isVigilante, router])

  if (!isAuthenticated || !isVigilante) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0e2c52] flex flex-col">
      {/* Navbar flotante en la parte superior */}
      <div className="bg-[#0e2c52] p-4 border-b border-[#1a4580] flex items-center fixed top-0 left-0 w-full z-40 shadow-md">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="bg-[#1a4580] text-white p-2 rounded-md hover:bg-[#2a5590] focus:outline-none"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-xl font-bold text-white ml-4">Panel Vigilante</h1>
      </div>

      {/* Contenedor principal */}
      <div className="flex flex-1 mt-[65px]">
        {/* Sidebar */}
        <div
          className={`w-64 bg-[#0e2c52] text-white border-r border-[#1a4580] fixed top-[65px] h-[calc(100vh-65px)] transition-transform duration-300 ease-in-out z-20 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 flex justify-between items-center">
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-gray-300 focus:outline-none ml-auto"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-2">
            <Link
              href="/vigilante"
              className={`flex items-center py-3 px-4 ${
                pathname === "/vigilante"
                  ? "bg-[#1a4580] text-white"
                  : "text-gray-300 hover:bg-[#1a4580] hover:text-white"
              } transition-colors`}
            >
              <ScanLine className="mr-3 h-5 w-5" />
              <span>Escanear QR</span>
            </Link>
            <Link
              href="/vigilante/historial"
              className={`flex items-center py-3 px-4 ${
                pathname === "/vigilante/historial"
                  ? "bg-[#1a4580] text-white"
                  : "text-gray-300 hover:bg-[#1a4580] hover:text-white"
              } transition-colors`}
            >
              <ClipboardList className="mr-3 h-5 w-5" />
              <span>Historial de Entradas</span>
            </Link>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button onClick={logout} className="flex items-center text-white hover:text-red-300 transition-colors">
              <LogOut className="mr-2 h-5 w-5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Main content - ajustamos el margen izquierdo según el estado del sidebar */}
        <div className={`transition-all duration-300 ease-in-out flex-1 p-6 mt-0 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
