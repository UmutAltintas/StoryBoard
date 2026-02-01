/**
 * utils.ts - Utility functions used throughout the app
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn - Combines Tailwind CSS classes intelligently
 * 
 * Merges class names and handles conflicts (e.g., "p-2 p-4" becomes "p-4").
 * Essential for building reusable components with customizable styles.
 * 
 * Example:
 *   cn("p-4 bg-red-500", isActive && "bg-blue-500", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
