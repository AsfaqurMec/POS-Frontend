/**
 * PWA Service Worker Registration & Installation Prompt Handler
 */

type InstallPromptListener = (canInstall: boolean) => void;

let deferredPrompt: any = null;
const listeners: Set<InstallPromptListener> = new Set();

function notifyListeners() {
  const can = Boolean(deferredPrompt);
  listeners.forEach((fn) => fn(can));
}

/**
 * Register Service Worker safely on the client.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  // Register only when window is loaded to prevent slowing down initial page render
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Optional update check
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[PWA] New version ready.");
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn("[PWA] Service worker registration failed:", err);
      });
  });

  // Listen for Chrome / Chromium PWA install prompt
  window.addEventListener("beforeinstallprompt", (e: any) => {
    // Prevent the mini-infobar from appearing on mobile/desktop automatically
    e.preventDefault();
    deferredPrompt = e;
    notifyListeners();
  });

  // Listen for successful installation
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyListeners();
    console.log("[PWA] POS app was successfully installed.");
  });
}

/**
 * Check if the browser currently allows triggering the native install prompt.
 */
export function canInstallPwa(): boolean {
  return Boolean(deferredPrompt);
}

/**
 * Triggers the browser's native PWA installation dialog.
 * Resolves to true if user accepted, false if dismissed or unavailable.
 */
export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    notifyListeners();
    return outcome === "accepted";
  } catch (err) {
    console.warn("[PWA] Prompt installation failed:", err);
    deferredPrompt = null;
    notifyListeners();
    return false;
  }
}

/**
 * Subscribe to install prompt availability changes.
 */
export function subscribeInstallPrompt(listener: InstallPromptListener): () => void {
  listeners.add(listener);
  listener(Boolean(deferredPrompt));
  return () => {
    listeners.delete(listener);
  };
}
