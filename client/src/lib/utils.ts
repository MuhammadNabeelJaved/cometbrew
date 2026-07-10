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

/**
 * Rewrite a Cloudinary delivery URL to serve an auto-format, auto-quality,
 * width-capped version. Raw uploads can be multi-MB (one portfolio image was
 * 7.3 MB); this makes Cloudinary transcode to WebP/AVIF at display size.
 * Non-Cloudinary URLs and already-transformed URLs pass through unchanged.
 */
export function optimizeCloudinaryUrl(url: string, width = 800): string {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  const [prefix, suffix] = url.split("/upload/");
  if (/^(f_|q_|w_|c_)/.test(suffix)) return url; // already transformed
  return `${prefix}/upload/f_auto,q_auto,w_${width},c_limit/${suffix}`;
}