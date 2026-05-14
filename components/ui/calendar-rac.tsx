"use client"

import { cn } from "@/lib/utils"
import { getLocalTimeZone, today } from "@internationalized/date"
import { ComponentProps } from "react"
import {
  Button,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  Heading as HeadingRac,
  composeRenderProps,
} from "react-aria-components"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BaseCalendarProps {
  className?: string
}

type CalendarProps = ComponentProps<typeof CalendarRac> & BaseCalendarProps

const CalendarHeader = () => (
  <header className="flex w-full items-center gap-1 pb-1">
    <Button
      slot="previous"
      className="flex size-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
    >
      <ChevronLeft className="w-4 h-4" />
    </Button>
    <HeadingRac className="grow text-center text-sm font-semibold text-gray-800" />
    <Button
      slot="next"
      className="flex size-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
    >
      <ChevronRight className="w-4 h-4" />
    </Button>
  </header>
)

const CalendarGridComponent = () => {
  const now = today(getLocalTimeZone())

  return (
    <CalendarGridRac>
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac className="size-9 rounded-lg p-0 text-xs font-medium text-gray-400">
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac className="[&_td]:px-0">
        {(date) => (
          <CalendarCellRac
            date={date}
            className={cn(
              "relative flex size-9 items-center justify-center rounded-xl border border-transparent p-0 text-sm font-normal text-gray-800 duration-150 focus:outline-none",
              "data-[hovered]:bg-gray-100 data-[hovered]:text-gray-900",
              "data-[selected]:bg-black data-[selected]:text-white data-[selected]:rounded-xl",
              "data-[disabled]:opacity-30 data-[disabled]:pointer-events-none",
              "data-[unavailable]:opacity-30 data-[unavailable]:pointer-events-none data-[unavailable]:line-through",
              // 오늘 날짜 점 표시
              date.compare(now) === 0 &&
                "after:pointer-events-none after:absolute after:bottom-1 after:start-1/2 after:z-10 after:size-[3px] after:-translate-x-1/2 after:rounded-full after:bg-black data-[selected]:after:bg-white",
            )}
          />
        )}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  )
}

const Calendar = ({ className, ...props }: CalendarProps) => {
  return (
    <CalendarRac
      {...props}
      className={composeRenderProps(className, (className) =>
        cn("w-full", className),
      )}
    >
      <CalendarHeader />
      <CalendarGridComponent />
    </CalendarRac>
  )
}

export { Calendar }
