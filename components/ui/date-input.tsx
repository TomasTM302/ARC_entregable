"use client"

import { useState, useEffect } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateInputProps {
  onChange: (date: Date | undefined) => void
  className?: string
  initialDate?: Date
  placeholder?: string
}

export function DateInput({ onChange, className, initialDate, placeholder = "Seleccionar fecha" }: DateInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(initialDate)

  useEffect(() => {
    onChange(date)
  }, [date, onChange])

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between border-gray-300 bg-white text-left font-normal text-gray-700 shadow-sm hover:bg-gray-50",
              !date && "text-gray-500",
            )}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <span>{date ? format(date, "dd/MM/yyyy", { locale: es }) : placeholder}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <div className="grid gap-2">
              <div className="font-medium text-sm">Fecha</div>
              <input
                type="date"
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                value={date ? format(date, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const newDate = e.target.value ? new Date(e.target.value) : undefined
                  setDate(newDate)
                  setIsOpen(false)
                }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDate(undefined)
                  onChange(undefined)
                  setIsOpen(false)
                }}
              >
                Limpiar
              </Button>
              <Button size="sm" onClick={() => setIsOpen(false)}>
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
