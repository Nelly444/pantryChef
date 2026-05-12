import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes without conflicts.
 * Uses tailwind-merge so later classes genuinely override earlier ones
 * (e.g. passing p-0 after p-3 correctly removes p-3, not just adds both).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
