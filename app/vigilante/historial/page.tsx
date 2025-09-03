"use client"

import type React from "react"

import { useState } from "react"
import { useEntryHistoryStore, type EntryRecord } from "@/lib/entry-history-store"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, User, Home, Car, Clock, Users } from "lucide-react"

export default function HistorialPage() {
  const { entries } = useEntryHistoryStore()
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar entradas según el término de búsqueda
  const filteredEntries = entries.filter((entry) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      entry.visitorName.toLowerCase().includes(searchLower) ||
      entry.destination.toLowerCase().includes(searchLower) ||
      (entry.vehicle?.plate && entry.vehicle.plate.toLowerCase().includes(searchLower))
    )
  })

  return (
    <div className="bg-white rounded-lg p-6 w-full text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Historial de Entradas</h2>
      </div>

      {/* Buscador */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Buscar por nombre, destino o placa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-50 border-gray-200"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Lista de entradas */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No se encontraron registros de entrada</p>
          {searchTerm && (
            <p className="text-gray-400 mt-2">
              Intente con otros términos de búsqueda o verifique los filtros aplicados
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

function EntryCard({ entry }: { entry: EntryRecord }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3">
          <div className="bg-[#3b6dc7] text-white p-2 rounded-full">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{entry.visitorName}</h3>
            <div className="flex items-center text-gray-600 mt-1">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">{entry.entryTime}</span>
            </div>
          </div>
        </div>
        {entry.companions > 0 && (
          <div className="bg-gray-100 px-2 py-1 rounded-full flex items-center">
            <Users className="h-3 w-3 mr-1 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">+{entry.companions}</span>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-center text-gray-600">
          <Home className="h-4 w-4 mr-2 text-gray-400" />
          <span>{entry.destination}</span>
        </div>
        {entry.phoneNumber && (
          <div className="flex items-center text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-gray-400" />
            <span>{entry.phoneNumber}</span>
          </div>
        )}
      </div>

      {entry.vehicle && (
        <div className="mt-2 flex items-center bg-gray-50 p-2 rounded">
          <Car className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium mr-2">{entry.vehicle.plate}</span>
          <span className="text-sm text-gray-500">{entry.vehicle.model}</span>
        </div>
      )}
    </div>
  )
}

// Componente de icono de teléfono
function Phone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
