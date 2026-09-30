/**
 * Production-ready Fullscreen and Display Mode Utility for POS Terminal.
 * Handles modern W3C standard Fullscreen API and legacy vendor prefixes gracefully.
 */

export type DisplayMode = "browser" | "standalone" | "fullscreen";

/**
 * Returns true if the document is currently in fullscreen mode.
 */
export function isFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
  );
}

/**
 * Returns true if the app is running in standalone PWA or kiosk mode.
 */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Standard CSS display-mode media query
  const isDisplayStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isDisplayFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;

  // 2. iOS Safari standalone flag
  const isIosStandalone = (window.navigator as any).standalone === true;

  // 3. Android app referrer check
  const isAndroidApp = typeof document !== "undefined" && document.referrer.includes("android-app://");

  return Boolean(isDisplayStandalone || isDisplayFullscreen || isIosStandalone || isAndroidApp);
}

/**
 * Returns whether Fullscreen API is supported by the current browser.
 */
export function isFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
  );
}

/**
 * Requests fullscreen on the target element (defaults to document.documentElement).
 * Safe against user rejections, permission restrictions, or non-user-gesture invocations.
 */
export async function enterFullscreen(element?: HTMLElement | null): Promise<boolean> {
  if (typeof document === "undefined") return false;
  const target = element || document.documentElement;

  try {
    if (target.requestFullscreen) {
      await target.requestFullscreen();
      return true;
    } else if ((target as any).webkitRequestFullscreen) {
      await (target as any).webkitRequestFullscreen();
      return true;
    } else if ((target as any).mozRequestFullScreen) {
      await (target as any).mozRequestFullScreen();
      return true;
    } else if ((target as any).msRequestFullscreen) {
      await (target as any).msRequestFullscreen();
      return true;
    }
    console.warn("[Fullscreen] API not supported on this browser.");
    return false;
  } catch (error) {
    console.warn("[Fullscreen] Request failed or was denied:", error);
    return false;
  }
}

/**
 * Exits fullscreen mode if currently active.
 */
export async function exitFullscreen(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  if (!isFullscreen()) return true;

  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return true;
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
      return true;
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
      return true;
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
      return true;
    }
    return false;
  } catch (error) {
    console.warn("[Fullscreen] Exit failed:", error);
    return false;
  }
}

/**
 * Toggles fullscreen mode depending on current state.
 */
export async function toggleFullscreen(element?: HTMLElement | null): Promise<boolean> {
  if (isFullscreen()) {
    return exitFullscreen();
  } else {
    return enterFullscreen(element);
  }
}

/**
 * Returns current display mode: 'fullscreen', 'standalone', or 'browser'.
 */
export function getDisplayMode(): DisplayMode {
  if (isFullscreen()) return "fullscreen";
  if (isStandalone()) return "standalone";
  return "browser";
}
