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
 * Ensure an external link has a protocol — links stored as bare domains
 * ("site.netlify.app") would otherwise resolve relative to the current page.
 */
export function externalUrl(url: string): string {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/**
 * SEO-friendly public URL slug for a portfolio project: "project-name-<mongoId>".
 * The trailing 24-hex id is what the detail page extracts for the API call,
 * so plain-id URLs keep working.
 */
export function projectSlug(p: { _id: string; projectTitle?: string }): string {
  const name = (p.projectTitle || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return name ? `${name}-${p._id}` : p._id;
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