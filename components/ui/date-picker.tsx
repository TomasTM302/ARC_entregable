"use client"

import { useState, useEffect } from "react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  selectedDate?: Date
  onDateChange: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  className?: string
}

export function DatePicker({ selectedDate, onDateChange, minDate, maxDate, className }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<Date[]>([])

  // Generate calendar days for the current month
  useEffect(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    setCalendarDays(days)
  }, [currentMonth])

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Check if a date is selectable
  const isSelectable = (date: Date) => {
    if (minDate && date < minDate) return false
    if (maxDate && date > maxDate) return false
    return true
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (isSelectable(date)) {
      onDateChange(date)
    }
  }

  // Get day names in Spanish
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  return (
    <div className={cn("bg-white rounded-lg shadow-lg p-4", className)}>
      {/* Header with month and navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        <h2 className="text-lg font-semibold text-gray-800">{format(currentMonth, "MMMM yyyy", { locale: es })}</h2>

        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the start of month */}
        {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() || 7 }).map(
          (_, index) => (
            <div key={`empty-start-${index}`} className="h-10 w-full" />
          ),
        )}

        {/* Actual days of the month */}
        {calendarDays.map((day) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isCurrentDay = isToday(day)
          const canSelect = isSelectable(day)

          return (
            <button
              key={day.toString()}
              onClick={() => handleDateSelect(day)}
              disabled={!canSelect}
              className={cn(
                "h-10 w-full rounded-full flex items-center justify-center text-sm transition-colors",
                isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                !isSelected && isCurrentDay && "border border-blue-500 text-blue-600",
                !isSelected && !isCurrentDay && canSelect && "hover:bg-gray-100 text-gray-800",
                !canSelect && "text-gray-400 cursor-not-allowed opacity-50",
                !isCurrentMonth && "opacity-0 cursor-default",
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}
