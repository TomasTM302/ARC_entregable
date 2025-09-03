"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { format, addDays, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"

interface DateRangePickerProps {
  onChange: (range: { from: Date; to: Date } | undefined) => void
  className?: string
  initialDateRange?: { from: Date; to: Date }
}

export function DateRangePicker({ onChange, className, initialDateRange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(initialDateRange || undefined)
  const [rangeType, setRangeType] = useState("custom")
  const [currentView, setCurrentView] = useState<"from" | "to">("from")

  useEffect(() => {
    if (dateRange) {
      onChange(dateRange)
    }
  }, [dateRange, onChange])

  const handleRangeChange = (type: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let from = today
    let to = today

    switch (type) {
      case "today":
        from = today
        to = today
        break
      case "yesterday":
        from = subDays(today, 1)
        to = subDays(today, 1)
        break
      case "last7days":
        from = subDays(today, 6)
        to = today
        break
      case "last30days":
        from = subDays(today, 29)
        to = today
        break
      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case "lastMonth":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        to = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case "nextWeek":
        from = addDays(today, 1)
        to = addDays(today, 7)
        break
      default:
        return
    }

    setDateRange({ from, to })
    setRangeType(type)
  }

  const formatDateRange = () => {
    if (!dateRange) return "Seleccionar fechas"

    if (dateRange.from && dateRange.to && format(dateRange.from, "dd/MM/yyyy") === format(dateRange.to, "dd/MM/yyyy")) {
      return format(dateRange.from, "dd/MM/yyyy")
    }

    return `${dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "Inicio"} - ${
      dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "Fin"
    }`
  }

  const handleSelect = (date: Date | undefined) => {
    if (currentView === "from") {
      setDateRange((prev) => ({ from: date || new Date(), to: prev?.to || date || new Date() }))
      setCurrentView("to")
    } else {
      setDateRange((prev) => ({ from: prev?.from || date || new Date(), to: date || new Date() }))
      // No cerramos el popover automáticamente para permitir ajustes
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between border-gray-300 bg-white text-left font-normal text-black shadow-sm hover:bg-gray-50",
              !dateRange && "text-gray-500",
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span>{formatDateRange()}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="grid gap-2">
              <div className="font-medium text-sm">Rango rápido</div>
              <Select value={rangeType} onValueChange={handleRangeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar rango" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="yesterday">Ayer</SelectItem>
                  <SelectItem value="last7days">Últimos 7 días</SelectItem>
                  <SelectItem value="last30days">Últimos 30 días</SelectItem>
                  <SelectItem value="thisMonth">Este mes</SelectItem>
                  <SelectItem value="lastMonth">Mes anterior</SelectItem>
                  <SelectItem value="nextWeek">Próxima semana</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="font-medium text-sm">
                {currentView === "from" ? "Seleccionar fecha inicial" : "Seleccionar fecha final"}
              </div>

              <div className="border rounded-md p-3">
                <Calendar
                  mode="single"
                  selected={currentView === "from" ? dateRange?.from : dateRange?.to}
                  onSelect={handleSelect}
                  locale={es}
                  initialFocus
                />
              </div>

              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setCurrentView("from")}>
                  Fecha inicial: {dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : "No seleccionada"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setCurrentView("to")}>
                  Fecha final: {dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : "No seleccionada"}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateRange(undefined)
                  onChange(undefined)
                  setIsOpen(false)
                }}
              >
                Limpiar
              </Button>
              <Button size="sm" onClick={() => setIsOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
