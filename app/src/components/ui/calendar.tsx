"use client"

import {
  DayPicker,
  type DayPickerProps,
} from "react-day-picker"

import { cn } from "@/lib/utils"

function Calendar({
  className,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      className={cn(
        "bg-background p-3 w-fit",
        className
      )}
      {...props}
    />
  )
}

export { Calendar }
