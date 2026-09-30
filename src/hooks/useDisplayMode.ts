"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isFullscreen as checkFullscreen,
  isStandalone as checkStandalone,
  isFullscreenSupported,
  enterFullscreen as requestEnterFullscreen,
  exitFullscreen as requestExitFullscreen,
  toggleFullscreen as requestToggleFullscreen,
  getDisplayMode,
  DisplayMode,
} from "@/lib/fullscreen";
import {
  canInstallPwa,
  promptPwaInstall,
  subscribeInstallPrompt,
} from "@/lib/pwa";

export interface DisplayModeState {
  isFullscreen: boolean;
  isStandalone: boolean;
  isSupported: boolean;
  canInstall: boolean;
  displayMode: DisplayMode;
  enterFullscreen: (element?: HTMLElement | null) => Promise<boolean>;
  exitFullscreen: () => Promise<boolean>;
  toggleFullscreen: (element?: HTMLElement | null) => Promise<boolean>;
  promptInstall: () => Promise<boolean>;
}

export function useDisplayMode(): DisplayModeState {
  const [fullscreen, setFullscreen] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [supported, setSupported] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // 1. Initial client-side sync
    setFullscreen(checkFullscreen());
    setStandalone(checkStandalone());
    setSupported(isFullscreenSupported());
    setCanInstall(canInstallPwa());

    // 2. Fullscreen change listener
    const handleFullscreenChange = () => {
      setFullscreen(checkFullscreen());
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleFullscreenChange);
    window.addEventListener("resize", handleFullscreenChange);

    // 3. Display-mode media query listener
    let mediaQuery: MediaQueryList | null = null;
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setStandalone(e.matches || checkStandalone());
    };

    if (typeof window !== "undefined" && window.matchMedia) {
      mediaQuery = window.matchMedia("(display-mode: standalone)");
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleMediaChange);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handleMediaChange);
      }
    }

    // 4. PWA installability listener
    const unsubscribeInstall = subscribeInstallPrompt((can) => {
      setCanInstall(can);
    });

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleFullscreenChange);
      window.removeEventListener("resize", handleFullscreenChange);

      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleMediaChange);
        } else if ((mediaQuery as any).removeListener) {
          (mediaQuery as any).removeListener(handleMediaChange);
        }
      }

      unsubscribeInstall();
    };
  }, []);

  const enterFullscreen = useCallback(async (el?: HTMLElement | null) => {
    const success = await requestEnterFullscreen(el);
    setFullscreen(checkFullscreen());
    return success;
  }, []);

  const exitFullscreen = useCallback(async () => {
    const success = await requestExitFullscreen();
    setFullscreen(checkFullscreen());
    return success;
  }, []);

  const toggleFullscreen = useCallback(async (el?: HTMLElement | null) => {
    const success = await requestToggleFullscreen(el);
    setFullscreen(checkFullscreen());
    return success;
  }, []);

  const promptInstall = useCallback(async () => {
    const accepted = await promptPwaInstall();
    if (accepted) {
      setStandalone(true);
    }
    return accepted;
  }, []);

  return {
    isFullscreen: fullscreen,
    isStandalone: standalone,
    isSupported: supported,
    canInstall,
    displayMode: getDisplayMode(),
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    promptInstall,
  };
}

/**
 * Convenience alias for components specifically requiring fullscreen capabilities.
 */
export const useFullscreen = useDisplayMode;
