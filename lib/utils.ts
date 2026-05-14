import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, addHours, startOfHour, isBefore, isAfter } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
import { ko } from 'date-fns/locale'

export function formatTime(dateStr: string) {
  return format(new Date(dateStr), 'HH:mm', { locale: ko })
}

export function formatDateTime(dateStr: string) {
  return format(new Date(dateStr), 'MM/dd HH:mm', { locale: ko })
}

export function getNextHourSlots(count = 12) {
  const now = new Date()
  const slots: { start: Date; end: Date; label: string }[] = []
  let slot = startOfHour(addHours(now, 1))
  for (let i = 0; i < count; i++) {
    const end = addHours(slot, 1)
    slots.push({
      start: slot,
      end,
      label: `${format(slot, 'MM/dd HH:mm')} ~ ${format(end, 'HH:mm')}`,
    })
    slot = end
  }
  return slots
}

export function isSessionExpired(endTime: string) {
  return isBefore(new Date(endTime), new Date())
}

export function isSessionUpcoming(startTime: string) {
  return isAfter(new Date(startTime), new Date())
}
