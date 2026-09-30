"use client";

import { useEffect, useRef } from "react";

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  maxIntervalMs?: number; // max time between keystrokes for scanner (default: 40ms)
  minLength?: number;     // minimum barcode length (default: 3)
}

export function useBarcodeScanner({
  onScan,
  maxIntervalMs = 40,
  minLength = 3,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is intentionally typing into a regular text input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        // Only ignore if target is NOT marked for scanner
        if (!target.hasAttribute("data-barcode-catcher")) {
          return;
        }
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (e.key === "Enter") {
        if (bufferRef.current.length >= minLength) {
          e.preventDefault();
          const scannedCode = bufferRef.current.trim();
          bufferRef.current = "";
          onScan(scannedCode);
        } else {
          bufferRef.current = "";
        }
        return;
      }

      // If time between keystrokes is too long, reset buffer (user is typing slowly manually)
      if (timeDiff > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      // Only accumulate printable single characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onScan, maxIntervalMs, minLength]);
}
