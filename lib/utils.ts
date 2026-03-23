import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatText(text: string) {
  return `${text[0].toUpperCase()}${text.slice(1)}`
}

export function formatTextCapitalise(text: string) {
  return `${text.toUpperCase()}`
}

export function formatDate(date: string): string {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
}