import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for safe, conflict-free className merging.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-violet-600", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
