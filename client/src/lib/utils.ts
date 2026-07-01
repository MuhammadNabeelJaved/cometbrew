/**
 * Helper Utility for Class Names
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * techStack entries may be legacy plain strings or the newer
 * `{ name, version, icon }` objects — always resolve to a display string.
 */
export function techName(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "name" in item) {
    return String((item as { name: unknown }).name ?? "");
  }
  return "";
}