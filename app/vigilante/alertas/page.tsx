"use client"

import { useState } from "react"
import { useSecurityStore } from "@/lib/security-store"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Bell, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AlertasPage() {
  const { securityAlerts, markAlertAsAttended } = useSecurityStore()
  const [filter, setFilter] = useState<"all" | "pending" | "attended">("all")

  // Filtrar alertas según el filtro seleccionado
  const filteredAlerts = securityAlerts.filter((alert) => {
    if (filter === "pending") return !alert.attended
    if (filter === "attended") return alert.attended
    return true
  })

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d 'de' MMMM, yyyy - HH:mm", { locale: es })
  }

  return (
    <div className="bg-white rounded-lg p-6 w-full text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Bell className="h-6 w-6 mr-2 text-[#3b6dc7]" />
          <h2 className="text-2xl font-semibold">Avisos y Alertas</h2>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            className={filter === "all" ? "bg-[#3b6dc7]" : ""}
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            className={filter === "pending" ? "bg-[#3b6dc7]" : ""}
            onClick={() => setFilter("pending")}
          >
            Pendientes
          </Button>
          <Button
            variant={filter === "attended" ? "default" : "outline"}
            className={filter === "attended" ? "bg-[#3b6dc7]" : ""}
            onClick={() => setFilter("attended")}
          >
            Atendidos
          </Button>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No hay avisos disponibles con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${
                alert.attended ? "bg-gray-50 text-gray-800" : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              <div className="flex items-start">
                <AlertTriangle className={`h-5 w-5 mr-2 mt-0.5 ${alert.attended ? "text-gray-400" : "text-red-500"}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold">
                      Alerta de {alert.houseId}
                      {alert.attended && <span className="ml-2 text-sm text-gray-500">(Atendida)</span>}
                    </h3>
                    <span className="text-xs text-gray-500">{formatDate(alert.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1 font-medium">{alert.message}</p>

                  {!alert.attended && (
                    <Button
                      className="mt-3 bg-[#3b6dc7] hover:bg-[#2d5db3] text-white text-sm py-1 h-8"
                      onClick={() => markAlertAsAttended(alert.id)}
                    >
                      Marcar como atendida
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
