"use client"

import { useState, useEffect, ReactNode } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Utensils,
  Waves,
  GlassWater,
  Users,
  Clock,
  Calendar,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/lib/auth"
import AuthGuard from "@/components/auth-guard"
import ReservationModal from "@/components/reservation-modal"

type AreaType = "common" | "private"

interface Area {
  id: string | number
  name: string
  description?: string
  icon?: string
  type?: AreaType
  tipo?: AreaType // por compatibilidad con API
  isActive?: boolean
  capacity?: number
  maxPeople?: number
  deposit?: number
  price?: number // normalizado
  costo_reservacion?: number // campo de BD
  operatingHours?: string
  schedule?: string // por compatibilidad
  maxDuration?: number // en horas
  maxAdvanceBookingDays?: number
  // disponibilidad opcional
  maxSimultaneousBookings?: number
  currentBookings?: number
  // detalles opcionales
  details?: string[]
}

export default function ReservaAreasPage() {
  const [activeTab, setActiveTab] = useState<"uso-comun" | "evento-privado">("uso-comun")
  const { user } = useAuthStore()

  const [areas, setAreas] = useState<Area[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedArea, setSelectedArea] = useState({
    id: "",
    name: "",
    maxPeople: 0,
  price: 0,
    operatingHours: "",
    maxDuration: 0,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/areas-comunes")
        const data = await res.json()
        if (data?.success && Array.isArray(data?.areas)) {
          setAreas(data.areas as Area[])
        } else {
          setAreas([])
        }
      } catch {
        setAreas([])
      }
    }
    load()
  }, [])

  const formatMoney = (n?: number) =>
    typeof n === "number" ? n.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) : "—"

  const pluralize = (value: number, singular: string, plural: string) =>
    `${value} ${value === 1 ? singular : plural}`

  const getIconComponent = (iconName?: string): ReactNode => {
    switch ((iconName || "").toLowerCase()) {
      case "utensils":
        return <Utensils className="h-10 w-10 text-[#3b6dc7]" />
      case "waves":
        return <Waves className="h-10 w-10 text-[#3b6dc7]" />
      case "glass-water":
      case "glasswater":
        return <GlassWater className="h-10 w-10 text-[#3b6dc7]" />
      case "users":
        return <Users className="h-10 w-10 text-[#3b6dc7]" />
      default:
        return <Utensils className="h-10 w-10 text-[#3b6dc7]" />
    }
  }

  const handleReserveClick = (areaId: string | number) => {
    const area = areas.find((a) => String(a.id) === String(areaId))
    if (area && area.isActive !== false) {
      const cost = (typeof area.costo_reservacion === "number" ? area.costo_reservacion : area.price) ?? 0
      setSelectedArea({
        id: String(area.id),
        name: area.name,
        maxPeople: (area.maxPeople ?? area.capacity ?? 0),
        price: cost,
        operatingHours: (area.operatingHours ?? area.schedule ?? ""),
        maxDuration: area.maxDuration ?? 0,
      })
      setIsModalOpen(true)
    }
  }

  const commonAreas = areas.filter((area) => (area.type ?? area.tipo) === "common")
  const privateAreas = areas.filter((area) => (area.type ?? area.tipo) === "private")

  return (
    <AuthGuard requireAuth>
      <main className="flex min-h-screen flex-col bg-[#0e2c52] pb-20">
        <header className="container mx-auto py-4 px-4 max-w-7xl">
          <Link href="/home" className="flex items-center text-white hover:text-gray-200">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver al inicio
          </Link>
        </header>

        <section className="container mx-auto flex-1 flex flex-col items-center justify-start py-8 px-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl text-gray-800 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Reserva de Áreas Comunes</h2>

            <Tabs defaultValue="uso-comun" className="w-full" onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="uso-comun">Uso Común</TabsTrigger>
                <TabsTrigger value="evento-privado">Evento Privado</TabsTrigger>
              </TabsList>

              {/* USO COMÚN */}
              <TabsContent value="uso-comun" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
                  {commonAreas.map((area) => {
                    const isActive = area.isActive !== false
                    const maxPeople = area.maxPeople ?? area.capacity ?? 0
                    const operatingHours = area.operatingHours ?? area.schedule ?? "—"
                    const maxAdvance = area.maxAdvanceBookingDays ?? 0
                    const maxDuration = area.maxDuration ?? 0
                    const cost = (typeof area.costo_reservacion === "number" ? area.costo_reservacion : area.price)

                    return (
                      <div
                        key={String(area.id)}
                        className={`border rounded-lg overflow-hidden h-full flex flex-col ${!isActive ? "opacity-60" : ""}`}
                      >
                        <div className="bg-[#3b6dc7] text-white p-4">
                          <h3 className="text-xl font-semibold">{area.name}</h3>
                          <p className="text-sm opacity-90">Área común</p>
                        </div>

                        <div className="p-6 flex flex-col items-center flex-grow">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            {getIconComponent(area.icon)}
                          </div>

                          {area.description && (
                            <p className="text-center text-gray-700 mb-6">{area.description}</p>
                          )}

                          {Array.isArray(area.details) && area.details.length > 0 && (
                            <div className="w-full mb-4">
                              <details className="w-full">
                                <summary className="flex items-center justify-between cursor-pointer text-[#3b6dc7] hover:text-[#2d5db3] font-medium">
                                  Ver detalles de {area.name.toLowerCase()}
                                  <span className="text-[#3b6dc7]">▼</span>
                                </summary>
                                <div className="mt-3 text-sm text-gray-600 pl-2">
                                  <ul className="list-disc pl-5 space-y-1">
                                    {area.details.map((detail, index) => (
                                      <li key={index}>{detail}</li>
                                    ))}
                                  </ul>
                                </div>
                              </details>
                            </div>
                          )}

                          {typeof area.maxSimultaneousBookings === "number" &&
                            typeof area.currentBookings === "number" && (
                              <div className="w-full bg-blue-50 p-3 rounded-md mb-4 flex items-center">
                                <Users className="h-5 w-5 text-blue-500 mr-2" />
                                <span className="text-blue-700">
                                  Disponibilidad: {area.currentBookings}/{area.maxSimultaneousBookings} reservas
                                </span>
                              </div>
                            )}

                          <div className="w-full border-t pt-4 mt-auto">
                            {/* Si manejas un precio, muéstralo aquí. Si no, deja sólo el depósito */}
              {typeof cost === "number" && (
                              <h4 className="font-semibold text-lg mb-2">
                Costo de la reserva: {formatMoney(cost)}
                              </h4>
                            )}
                            <div className="space-y-1 text-sm text-gray-600 mb-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span>
                                  Reservación con máximo{" "}
                                  {pluralize(maxAdvance, "día", "días")} de anticipación
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                <span>Horario: {operatingHours}</span>
                              </div>
                              {/** Depósito reembolsable oculto por solicitud: se usa solo costo de reservación */}
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                <span>Capacidad máxima: {pluralize(maxPeople, "persona", "personas")}</span>
                              </div>
                              {maxDuration > 0 && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>Duración máxima: {pluralize(maxDuration, "hora", "horas")}</span>
                                </div>
                              )}
                            </div>

                            <Button
                              className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white"
                              onClick={() => handleReserveClick(area.id)}
                              disabled={!isActive}
                            >
                              {isActive ? "Reservar ahora" : "No disponible"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>

              {/* EVENTO PRIVADO */}
              <TabsContent value="evento-privado" className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-800 mb-1">Eventos Privados</h3>
                      <p className="text-sm text-blue-700">
                        Para reservar áreas comunes para eventos privados, es necesario hacer la solicitud con al menos
                        2 semanas de anticipación y está sujeta a aprobación por parte de la administración.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                  {privateAreas.map((area) => {
                    const isActive = area.isActive !== false
                    const maxPeople = area.maxPeople ?? area.capacity ?? 0
                    const operatingHours = area.operatingHours ?? area.schedule ?? "—"
                    const maxAdvance = area.maxAdvanceBookingDays ?? 0
                    const maxDuration = area.maxDuration ?? 0
                    const cost = (typeof area.costo_reservacion === "number" ? area.costo_reservacion : area.price)

                    return (
                      <div
                        key={String(area.id)}
                        className={`border rounded-lg overflow-hidden h-full flex flex-col ${!isActive ? "opacity-60" : ""}`}
                      >
                        <div className="bg-[#3b6dc7] text-white p-4">
                          <h3 className="text-xl font-semibold">{area.name}</h3>
                          <p className="text-sm opacity-90">Evento privado</p>
                        </div>

                        <div className="p-6 flex flex-col items-center flex-grow">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            {getIconComponent(area.icon)}
                          </div>

                          {area.description && (
                            <p className="text-center text-gray-700 mb-6">{area.description}</p>
                          )}

                          <div className="w-full border-t pt-4 mt-auto">
              {typeof cost === "number" && (
                              <h4 className="font-semibold text-lg mb-2">
                Costo de la reserva: {formatMoney(cost)}
                              </h4>
                            )}
                            <div className="space-y-1 text-sm text-gray-600 mb-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                <span>
                                  Reservación con máximo{" "}
                                  {pluralize(maxAdvance, "día", "días")} de anticipación
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                <span>Horario: {operatingHours}</span>
                              </div>
                              {maxDuration > 0 && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>Duración máxima: {pluralize(maxDuration, "hora", "horas")}</span>
                                </div>
                              )}
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                <span>Capacidad máxima: {pluralize(maxPeople, "persona", "personas")}</span>
                              </div>
                            </div>

                            <Button
                              className="w-full bg-[#3b6dc7] hover:bg-[#2d5db3] text-white"
                              onClick={() => handleReserveClick(area.id)}
                              disabled={!isActive}
                            >
                              {isActive ? "Solicitar reserva" : "No disponible"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        <ReservationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          areaId={selectedArea.id}
          areaName={selectedArea.name}
          maxPeople={selectedArea.maxPeople}
          price={selectedArea.price}
          operatingHours={selectedArea.operatingHours}
          maxDuration={selectedArea.maxDuration}
        />
      </main>
    </AuthGuard>
  )
}
