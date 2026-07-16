import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function padZero(num: number, length: number = 3): string {
  return num.toString().padStart(length, '0')
}

export function getTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1, 2)}-${padZero(d.getDate(), 2)}`
}
