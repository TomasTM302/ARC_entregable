"use client"

import EntryHistoryTable from "@/components/qr-scan-history"

export default function HistorialPage() {
  return (
    <div className="w-full px-4 md:px-6">
      {/* Título superior único */}
      <div className="bg-white rounded-lg p-4 md:p-6 w-full text-gray-800">
        <h2 className="text-2xl font-semibold">Historial de Entradas</h2>
      </div>
      {/* Historial responsive en layout compacto, sin título interno */}
      <EntryHistoryTable maxWidthClass="max-w-6xl" maxHeightClass="h-[60vh]" showTitle={false} layout="compact" />
    </div>
  )
}
