"use client";

import React, { useState, useEffect } from "react";
import { Lock, Unlock, Delete, AlertCircle, Coffee, ShieldCheck } from "lucide-react";
import { usePinStore } from "@/store/pinStore";
import { useAuthStore } from "@/store/authStore";
import { useBusiness } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function PinLockModal() {
  const { isLocked, lockReason, unlockTerminal, initLockState } = usePinStore();
  const { logout } = useAuthStore();
  const router = useRouter();
  const { data: business } = useBusiness();
  const { lang } = useLangStore();

  const [mounted, setMounted] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Initialize lock state from localStorage on mount
  useEffect(() => {
    setMounted(true);
    initLockState();
  }, [initLockState]);

  // Auto clear pin & error on open
  useEffect(() => {
    if (isLocked) {
      setPin("");
      setError(null);
    }
  }, [isLocked]);

  // Keyboard numeric listener
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        if (pin.length < 6) handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Enter") {
        if (pin.length >= 4) handleVerify(pin);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, pin]);

  if (!mounted || !isLocked) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(null);

      // Auto submit when 4 digits reached
      if (nextPin.length === 4) {
        handleVerify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin("");
    setError(null);
  };

  const handleVerify = async (codeToVerify: string) => {
    setIsVerifying(true);
    setError(null);
    try {
      const response = await api.post<{ unlocked: boolean }>("/auth/unlock-terminal", {
        pinCode: codeToVerify,
      });

      if (response && response.unlocked) {
        unlockTerminal();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || "Invalid PIN code. Please try again.");
      setPin("");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-2xl text-center space-y-6">
        {/* Header Icon & Brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-warmgray-900 dark:text-white">
              {business?.nameEn || "Aroma POS"}
            </h2>
            <p className="text-xs text-warmgray-500 font-medium">
              {lockReason || "Terminal Locked • Enter Staff PIN"}
            </p>
          </div>
        </div>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                pin.length > index
                  ? "bg-amber-600 scale-110 shadow-sm shadow-amber-500/50"
                  : "bg-warmgray-200 dark:bg-warmgray-800 border border-warmgray-300 dark:border-warmgray-700"
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/50 p-2 rounded-xl border border-red-200 dark:border-red-900">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(String(num))}
              disabled={isVerifying}
              className="h-14 rounded-2xl bg-warmgray-50 hover:bg-warmgray-100 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-900 dark:text-white text-xl font-bold transition active:scale-95 shadow-sm border border-warmgray-100 dark:border-warmgray-700/60 flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          <button
            onClick={handleClear}
            disabled={isVerifying || pin.length === 0}
            className="h-14 rounded-2xl bg-warmgray-50 hover:bg-warmgray-100 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-500 dark:text-warmgray-400 text-xs font-bold transition active:scale-95 border border-warmgray-100 dark:border-warmgray-700/60 uppercase tracking-wider"
          >
            Clear
          </button>

          <button
            onClick={() => handleKeyPress("0")}
            disabled={isVerifying}
            className="h-14 rounded-2xl bg-warmgray-50 hover:bg-warmgray-100 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-900 dark:text-white text-xl font-bold transition active:scale-95 shadow-sm border border-warmgray-100 dark:border-warmgray-700/60 flex items-center justify-center"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            disabled={isVerifying || pin.length === 0}
            className="h-14 rounded-2xl bg-warmgray-50 hover:bg-warmgray-100 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-300 transition active:scale-95 border border-warmgray-100 dark:border-warmgray-700/60 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>


        {/* Switch Account */}
        <div className="pt-2 border-t border-warmgray-100 dark:border-warmgray-800">
          <button
            type="button"
            onClick={async () => {
              unlockTerminal();
              logout();
              router.replace("/login");
            }}
            className="text-xs text-warmgray-500 hover:text-red-600 dark:hover:text-red-400 font-bold transition flex items-center justify-center gap-1 mx-auto"
          >
            <span>Sign in with another user</span>
          </button>
        </div>
      </div>
    </div>
  );
}
