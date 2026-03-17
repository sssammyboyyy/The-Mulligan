"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isSameDay,
  addDays,
  startOfDay,
} from "date-fns"

export interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  className?: string
}

function Calendar({ selected, onSelect, disabled, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

  const today = startOfDay(new Date())

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  // Split into weeks
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const handleDateClick = (date: Date) => {
    if (disabled?.(date)) return
    onSelect?.(date)
  }

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  return (
    <div className={cn("w-full", className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={handlePrevMonth}
          className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
        <button
          onClick={handleNextMonth}
          className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all duration-200 active:scale-95"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day names header - proper 7 column grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((name) => (
          <div
            key={name}
            className="h-10 flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid - proper 7 column layout */}
      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((date, dayIndex) => {
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isSelected = selected && isSameDay(date, selected)
              const isToday = isSameDay(date, today)
              const isDisabled = disabled?.(date) || false

              return (
                <button
                  key={dayIndex}
                  onClick={() => handleDateClick(date)}
                  disabled={isDisabled}
                  className={cn(
                    "aspect-square w-full rounded-xl flex items-center justify-center",
                    "text-sm font-medium transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
                    "active:scale-95",
                    // Outside current month
                    !isCurrentMonth && "text-muted-foreground/40",
                    // Today highlight
                    isToday && !isSelected && "bg-secondary/20 text-secondary font-bold ring-2 ring-secondary/30",
                    // Selected state
                    isSelected && "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
                    // Disabled state
                    isDisabled && "text-muted-foreground/25 cursor-not-allowed hover:bg-transparent",
                    // Default hover
                    !isSelected && !isDisabled && isCurrentMonth && "hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {format(date, "d")}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
