"use client"

import type React from "react"

import { useAuthStore } from "@/lib/auth"
import Link from "next/link"
import { User, Settings, HelpCircle, FileText, LogOut, ShieldAlert, Briefcase, PawPrint } from "lucide-react"

export default function MorePage() {
  const { logout, isAdmin, user } = useAuthStore()
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Usuario"

  return (
    <div className="py-4 px-2">
      <div className="flex items-center mb-6 p-4 bg-white rounded-lg shadow">
        <div className="w-16 h-16 bg-[#0e2c52] rounded-full flex items-center justify-center text-white text-2xl mr-4">
          {displayName.charAt(0) || "U"}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{displayName}</h2>
          <p className="text-gray-600">{user?.house || "Casa"}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">Mi cuenta</h3>
        </div>

        <div className="divide-y divide-gray-100">
          <MenuItem href="/profile" icon={<User size={20} className="text-[#0e2c52]" />} label="Mi perfil" />

          <MenuItem
            href="/payments/history"
            icon={<FileText size={20} className="text-[#0e2c52]" />}
            label="Historial de pagos"
          />

          <MenuItem href="/mascotas" icon={<PawPrint size={20} className="text-[#0e2c52]" />} label="Mis mascotas" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-800">Servicios</h3>
        </div>

        <div className="divide-y divide-gray-100">
          <MenuItem
            href="/comercios"
            icon={<Briefcase size={20} className="text-[#0e2c52]" />}
            label="Comercios cercanos"
          />

          <MenuItem
            href="/vigilancia"
            icon={<ShieldAlert size={20} className="text-[#0e2c52]" />}
            label="Solicitar vigilancia"
          />

          {isAdmin && (
            <MenuItem
              href="/admin"
              icon={<Settings size={20} className="text-[#0e2c52]" />}
              label="Panel de administración"
            />
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mt-4">
        <div className="divide-y divide-gray-100">
          <MenuItem href="/help" icon={<HelpCircle size={20} className="text-[#0e2c52]" />} label="Ayuda y soporte" />

          <button onClick={logout} className="flex items-center w-full px-4 py-3 hover:bg-gray-50">
            <LogOut size={20} className="text-red-500 mr-3" />
            <span className="text-gray-800">Cerrar sesión</span>
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>ARC Portal v1.0</p>
  <p className="mt-1">© 2023 ARC. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}

interface MenuItemProps {
  href: string
  icon: React.ReactNode
  label: string
}

function MenuItem({ href, icon, label }: MenuItemProps) {
  return (
    <Link href={href} className="flex items-center px-4 py-3 hover:bg-gray-50">
      <div className="mr-3">{icon}</div>
      <span className="text-gray-800">{label}</span>
    </Link>
  )
}
