"use client"

import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, components, locale = es, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white rounded-lg shadow-lg border-0 text-black", className)}
      locale={locale}
      classNames={{
        months: "space-y-4",
        month: "space-y-4",
        caption: "flex justify-between px-1 py-2 items-center",
        caption_label: "text-base font-medium text-black",
        nav: "flex items-center space-x-1",
        nav_button: cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-7 w-7 bg-gray-100 hover:bg-gray-200 p-0 text-black",
        ),
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "w-9 font-normal text-[0.8rem] text-black",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal text-black aria-selected:opacity-100 rounded-md hover:bg-gray-100 focus:bg-gray-100",
        ),
        day_selected: "bg-[#D4AF37] text-white hover:bg-[#C9A633] hover:text-white focus:bg-[#C9A633] focus:text-white",
        day_today: "border border-[#D4AF37] text-black bg-yellow-50",
        day_outside: "text-gray-400 opacity-50",
        day_disabled: "text-gray-400 opacity-30",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-black",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4 text-black" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4 text-black" />,
        ...components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
