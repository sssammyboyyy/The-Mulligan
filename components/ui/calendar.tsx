"use client"

import type * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full", className)}
      classNames={{
        months: "flex flex-col w-full",
        month: "w-full",
        caption: "flex justify-between items-center px-2 py-3 mb-2",
        caption_label: "text-lg font-semibold text-foreground tracking-tight",
        nav: "flex items-center gap-2",
        nav_button: cn(
          "inline-flex items-center justify-center rounded-full",
          "h-10 w-10 sm:h-9 sm:w-9",
          "bg-primary/10 hover:bg-primary/20",
          "text-primary hover:text-primary",
          "transition-all duration-200",
          "active:scale-95",
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "flex w-full mb-2",
        head_cell: cn(
          "flex-1 text-center",
          "text-xs font-semibold uppercase tracking-wider",
          "text-muted-foreground/70",
          "py-2",
        ),
        row: "flex w-full",
        cell: cn("flex-1 p-0.5 sm:p-1", "text-center text-sm", "relative", "[&:has([aria-selected])]:bg-transparent"),
        day: cn(
          "inline-flex items-center justify-center",
          "w-full aspect-square",
          "rounded-xl sm:rounded-lg",
          "text-sm font-medium",
          "transition-all duration-200",
          "hover:bg-primary/10 hover:text-primary",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1",
          "active:scale-95",
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground",
          "hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground",
          "shadow-lg shadow-primary/30",
          "font-bold",
        ),
        day_today: cn("bg-secondary/20 text-secondary", "font-bold", "ring-2 ring-secondary/40 ring-inset"),
        day_outside: "text-muted-foreground/40",
        day_disabled: "text-muted-foreground/30 cursor-not-allowed hover:bg-transparent",
        day_range_middle: "aria-selected:bg-accent/20 aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeftIcon className="h-5 w-5" />,
        IconRight: () => <ChevronRightIcon className="h-5 w-5" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
