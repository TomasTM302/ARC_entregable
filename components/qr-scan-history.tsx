"use client"

import { useEffect, useState, Fragment, useMemo } from "react"
import { parseISO, format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { RefreshCw, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// 1) Función de validación robusta (hoy y posteriores, hora ≥ ahora+1h)
function validateDateTime(dateStr: string, timeStr: string): string | null {
  const dateParts = dateStr.split("-").map(Number)
  if (dateParts.length !== 3) {
    return "Formato de fecha inválido (debe ser YYYY-MM-DD)"
  }
  const [year, month, day] = dateParts

  if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return "Formato de hora inválido (debe ser HH:MM)"
  }
  const [h, m] = timeStr.split(":").map(Number)
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return "Hora o minutos fuera de rango"
  }

  // Only validate formats; older dates are allowed for display purposes
  // Additional temporal checks have been removed

  return null
}

// Parse the raw QR string into key/value pairs
function parseQrData(data: string): Record<string, string> {
  const lines = data.split("\n")
  const result: Record<string, string> = {}
  for (const line of lines) {
    const idx = line.indexOf(":")
    if (idx !== -1) {
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      result[key] = value
    }
  }
  return result
}

// Labels for well known QR fields
function getFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    NOMBRE: "Nombre",
    TELÉFONO: "Teléfono",
    TELEFONO: "Teléfono",
    FECHA: "Fecha de visita",
    HORA: "Hora de entrada",
    DIRECCIÓN: "Destino",
    DIRECCION: "Destino",
    ACOMPAÑANTES: "Acompañantes",
    ACOMPANANTES: "Acompañantes",
  }
  return labels[key] || key
}

interface ScanHistoryItem {
  id: number
  scanned_at: string
  ine?: string | null
  tipo?: string | null
  placa_vehiculo?: string | null
  fecha_entrada?: string | null
  fecha_salida?: string | null
  vigilante_id?: number | null
  condominio_id?: number | null
}

export default function EntryHistoryTable() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterDate, setFilterDate] = useState("")

  // Agrupa y filtra solo por la fecha real de entrada (fecha_entrada)
  const groupedHistory = useMemo(() => {
    const groups: Record<string, { item: ScanHistoryItem; qrData: Record<string, string> }[]> = {}

    for (const item of history) {
      const qrData = parseQrData(item.scanned_at)
      // Agrupa por la fecha de entrada real (YYYY-MM-DD, usando parseISO para evitar desfases)
      let dateKey = "Sin fecha"
      if (item.fecha_entrada) {
        // Usa parseISO para evitar desfases de zona horaria
        const dateObj = parseISO(item.fecha_entrada)
        dateKey = format(dateObj, "yyyy-MM-dd")
      }
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push({ item, qrData })
    }

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Sin fecha") return 1
      if (b === "Sin fecha") return -1
      return a < b ? 1 : -1 // descendente
    })

    return sortedKeys.map((date) => ({ date, records: groups[date] }))
  }, [history])

  const fetchHistory = async (date?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = date ? `/api/entry-history?date=${date}` : "/api/entry-history"
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al obtener historial")
      }
      setHistory(data.data)
    } catch (e: any) {
      setError("No se pudo cargar el historial.")
      toast({
        title: "Error al cargar historial",
        description: e.message || "Ocurrió un error desconocido.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    try {
      const res = await fetch("/api/entry-history", { method: "DELETE" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al borrar historial")
      }
      setHistory([])
      toast({
        title: "Historial Borrado",
        description: "Todos los registros del historial han sido eliminados.",
      })
    } catch (e: any) {
      toast({
        title: "Error al borrar historial",
        description: e.message || "No se pudo borrar el historial.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchHistory(filterDate)
  }, [filterDate])

  return (
    <Card className="w-full max-w-2xl mt-8">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle>Historial de Entradas</CardTitle>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="max-w-[160px]"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchHistory(filterDate)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refrescar</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" disabled={history.length === 0}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Borrar Historial</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se borrarán permanentemente todos los registros del historial de entradas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={clearHistory} className="bg-destructive hover:bg-destructive/90">
                  Borrar Todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p>Cargando historial...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && history.length === 0 && <p>No hay registros en el historial.</p>}
        {!loading && !error && history.length > 0 && (
          <ScrollArea className="h-[300px]">
            {groupedHistory.map(({ date, records }) => (
              <div key={date} className="mb-4">
                <h4 className="font-semibold text-sm mb-2">
                  {date === "Sin fecha" ? date : format(parseISO(date), "dd/MM/yyyy")}
                </h4>
                <ul className="space-y-2">
                  {records.map(({ item, qrData }) => {
                    const validationError =
                      qrData.FECHA && qrData.HORA
                        ? validateDateTime(qrData.FECHA, qrData.HORA)
                        : "Faltan FECHA o HORA en el QR"
                    return (
                      <li
                        key={item.id}
                        className="p-3 border rounded-md bg-muted/50 space-y-2"
                      >
                        {validationError ? (
                          <p className="text-sm font-medium text-red-600">
                            ⚠️ Registro inválido: {validationError}
                          </p>
                        ) : (
                          <div>
                            <p className="text-sm font-medium">Datos QR</p>
                            <div className="grid grid-cols-[auto,1fr] gap-x-2 text-xs text-muted-foreground mb-2">
                              {Object.entries(qrData).map(([key, value]) => (
                                <Fragment key={key}>
                                  <span className="font-medium">{getFieldLabel(key)}:</span>
                                  <span className="truncate">{value}</span>
                                </Fragment>
                              ))}
                            </div>
                            {item.fecha_entrada && (
                              <p className="text-xs text-muted-foreground">
                                Entrada: {new Date(item.fecha_entrada).toLocaleString()}
                              </p>
                            )}
                            {item.fecha_salida && (
                              <p className="text-xs text-muted-foreground">
                                Salida: {new Date(item.fecha_salida).toLocaleString()}
                              </p>
                            )}
                            {item.tipo && (
                              <p className="text-xs text-muted-foreground">Tipo: {item.tipo}</p>
                            )}
                            {(item.ine || item.placa_vehiculo) && (
                              <div className="flex gap-2 mt-1">
                                {item.ine && (
                                  <a
                                    href={item.ine}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 text-xs truncate underline"
                                  >
                                    INE
                                  </a>
                                )}
                                {item.placa_vehiculo && (
                                  <a
                                    href={item.placa_vehiculo}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 text-xs truncate underline"
                                  >
                                    Placa
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
