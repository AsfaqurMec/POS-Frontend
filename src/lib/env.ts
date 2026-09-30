export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (API_BASE_URL.replace(/\/api\/?$/, "") || "http://localhost:5000");

/**
 * Normalizes relative or absolute media/upload paths into full URLs using the configured BACKEND_URL.
 */
export function getMediaUrl(path?: string | null): string {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
}
