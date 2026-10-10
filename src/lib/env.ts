export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (API_BASE_URL.replace(/\/api\/?$/, "") || "http://localhost:5000");

/**
 * Normalizes relative or absolute media/upload paths into clean URLs.
 * If path is relative (/uploads/...), returns it directly so Next.js rewrites and PWA Service Worker
 * can intercept and cache the images locally.
 */
export function getMediaUrl(path?: string | null): string {
  if (!path) return "/logo.png";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return cleanPath;
}
