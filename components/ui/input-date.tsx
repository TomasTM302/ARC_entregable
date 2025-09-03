"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface InputDateProps {
  value?: Date
  onChange: (date?: Date) => void
  placeholder?: string
  className?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
}

export function InputDate({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  minDate,
  maxDate,
  disabled = false,
}: InputDateProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleDateChange = (date: Date) => {
    onChange(date)
    setShowDatePicker(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        onClick={() => !disabled && setShowDatePicker(!showDatePicker)}
        disabled={disabled}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, "PPP", { locale: es }) : placeholder}

        {value && !disabled && (
          <span
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={handleClear}
          >
            ✕
          </span>
        )}
      </Button>

      {showDatePicker && !disabled && (
        <div className="absolute z-50 mt-1 w-full">
          <DatePicker
            selectedDate={value}
            onDateChange={handleDateChange}
            minDate={minDate}
            maxDate={maxDate}
            className="border border-gray-300"
          />
        </div>
      )}
    </div>
  )
}
