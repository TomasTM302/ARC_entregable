"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Users,
  Bell,
  Home,
  DollarSign,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Receipt,
  ShoppingCart,
  CheckSquare,
  PenToolIcon as Tool,
  BarChart2,
} from "lucide-react"
import { useAuthStore } from "@/lib/auth"
import AuthGuard from "@/components/auth-guard"
// Store eliminado; cargar settings desde API
import { useEffect, useState } from "react"

export default function AdminPanelPage() {
  const { user } = useAuthStore()
  const [maintenancePrice, setMaintenancePrice] = useState<number>(0)
  const [businessCount, setBusinessCount] = useState<number>(0)
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch("/api/comercios")
        const data = await res.json()
        if (!cancelled) setBusinessCount(Array.isArray(data?.comercios) ? data.comercios.length : 0)
      } catch {
        if (!cancelled) setBusinessCount(0)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/maintenance")
        const data = await res.json()
        if (!cancelled) setMaintenancePrice(Number(data?.settings?.price ?? 0))
      } catch {
        if (!cancelled) setMaintenancePrice(0)
      }
    }
    loadSettings()
    return () => { cancelled = true }
  }, [])

  return (
    <AuthGuard requireAuth requireAdmin>
      <main className="flex min-h-screen flex-col bg-[#0e2c52]">
        <header className="container mx-auto py-4 px-4 max-w-7xl">
          <Link href="/home" className="flex items-center text-white hover:text-gray-200">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver al inicio
          </Link>
        </header>

        {/* Modificar la sección principal para limitar el ancho máximo y centrar el contenido */}
        <section className="container mx-auto flex-1 flex flex-col items-start justify-start py-8 px-4 max-w-7xl">
          <div className="w-full mb-8">
            <h1 className="text-3xl font-bold text-white">Panel Administrativo</h1>
            <p className="text-gray-300 mt-2">
              Bienvenido, {user?.firstName} {user?.lastName}. Gestiona tu residencial desde aquí.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mx-auto">
            {/* Tarjeta de Usuarios */}
            <Link href="/admin/usuarios" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Usuarios</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <Users className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona los usuarios del residencial</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">24</span>
                  <span className="ml-2 text-sm text-gray-500">usuarios registrados</span>
                </div>
              </div>
            </Link>

            {/* Tarjeta de Convenios */}
            <Link href="/admin/convenios" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Convenios</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <FileText className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona los convenios de pago</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">5</span>
                  <span className="ml-2 text-sm text-gray-500">convenios activos</span>
                </div>
              </div>
            </Link>

            {/* Tarjeta de Multas */}
            <Link href="/admin/multas" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Multas</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <AlertTriangle className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona las multas a residentes</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">8</span>
                  <span className="ml-2 text-sm text-gray-500">multas pendientes</span>
                </div>
              </div>
            </Link>

            {/* Tarjeta de Mantenimiento */}
            <Link href="/admin/mantenimiento" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Mantenimiento</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <Receipt className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona la cuota mensual de mantenimiento</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">${maintenancePrice.toLocaleString()}</span>
                  <span className="ml-2 text-sm text-gray-500">cuota actual</span>
                </div>
              </div>
            </Link>

            {/* Tarjeta de Avisos */}
            <Link href="/avisos?from=admin" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Avisos</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <Bell className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona los avisos del residencial</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">8</span>
                  <span className="ml-2 text-sm text-gray-500">avisos activos</span>
                </div>
              </div>
            </Link>

            {/* Tarjeta de Áreas Comunes */}
            <Link href="/admin/areas-comunes" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Áreas Comunes</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <Home className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona las áreas comunes y sus reservas</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">5</span>
                  <span className="ml-2 text-sm text-gray-500">áreas disponibles</span>
                </div>
              </div>
            </Link>

            {/* Tarjeta de Pagos */}
            <Link href="/admin/pagos" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Pagos</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <DollarSign className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona los pagos de mantenimiento</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">$45,250</span>
                  <span className="ml-2 text-sm text-gray-500">recaudados este mes</span>
                </div>
              </div>
            </Link>

            {/* Tarjeta de Seguridad */}
            <Link href="/vigilancia" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Seguridad</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <ShieldAlert className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona la seguridad del residencial</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">12</span>
                  <span className="ml-2 text-sm text-gray-500">reportes de seguridad</span>
                </div>
              </div>
            </Link>

            {/* Tarjeta de Comercios Cercanos */}
            <Link href="/admin/comercios" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Comercios Cercanos</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <ShoppingCart className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona los comercios cercanos al residencial</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">{businessCount}</span>
                  <span className="ml-2 text-sm text-gray-500">comercios registrados</span>
                </div>
              </div>
            </Link>

            {/* Tarjeta de Tareas Administrativas (actualizada) */}
            <Link href="/admin/tareas-administrativas" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Tareas Administrativas</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <CheckSquare className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona las tareas administrativas</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">15</span>
                  <span className="ml-2 text-sm text-gray-500">tareas pendientes</span>
                </div>
              </div>
            </Link>

            {/* Nueva Tarjeta de Auxiliares */}
            <Link href="/admin/auxiliares" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Auxiliares</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <Tool className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Gestiona el personal auxiliar del residencial</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">3</span>
                  <span className="ml-2 text-sm text-gray-500">auxiliares activos</span>
                </div>
              </div>
            </Link>

            {/* Nueva Tarjeta de Estado de Resultados */}
            <Link href="/admin/estado-resultados" className="block">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow h-[200px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Estado de Resultados</h2>
                    <div className="p-3 bg-[#f9f1dc] rounded-full">
                      <BarChart2 className="h-6 w-6 text-[#d6b15e]" />
                    </div>
                  </div>
                  <p className="text-gray-600">Consulta los reportes financieros del residencial</p>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-800">$102,407</span>
                  <span className="ml-2 text-sm text-gray-500">balance actual</span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </AuthGuard>
  )
}
