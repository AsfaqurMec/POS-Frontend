"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";

/**
 * PwaManager ensures service worker registration runs safely on the client
 * and hooks up PWA lifecycle events without blocking page rendering.
 */
export function PwaManager() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
