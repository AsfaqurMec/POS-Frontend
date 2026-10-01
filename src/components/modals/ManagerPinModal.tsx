"use client";

import React, { useState } from "react";
import { ShieldAlert, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePinStore } from "@/store/pinStore";
import { api } from "@/lib/api";

export function ManagerPinModal() {
  const { isManagerModalOpen, managerActionTitle, onManagerSuccess, closeManagerModal } =
    usePinStore();

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isManagerModalOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4) {
        verifyManagerPin(nextPin);
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

  const verifyManagerPin = async (code: string) => {
    setIsVerifying(true);
    setError(null);
    try {
      const res = await api.post<{ valid: boolean }>("/auth/verify-manager-pin", {
        pinCode: code,
      });

      if (res && res.valid) {
        closeManagerModal();
        if (onManagerSuccess) {
          onManagerSuccess();
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || "Invalid Manager PIN");
      setPin("");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-warmgray-900 dark:text-white">
                Manager Override
              </h3>
              <p className="text-xs text-warmgray-500 font-medium">{managerActionTitle}</p>
            </div>
          </div>
          <button
            onClick={closeManagerModal}
            className="p-1.5 rounded-xl hover:bg-warmgray-100 dark:hover:bg-warmgray-800 text-warmgray-400 hover:text-warmgray-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-4 py-1">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                pin.length > index
                  ? "bg-purple-600 scale-110 shadow-sm shadow-purple-500/50"
                  : "bg-warmgray-200 dark:bg-warmgray-800"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/50 p-2 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(String(num))}
              disabled={isVerifying}
              className="h-12 rounded-xl bg-warmgray-50 hover:bg-warmgray-100 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-900 dark:text-white text-lg font-bold transition active:scale-95 border border-warmgray-100 dark:border-warmgray-700/60"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-12 rounded-xl bg-warmgray-50 hover:bg-warmgray-100 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-500 text-xs font-bold uppercase"
          >
            Clear
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            className="h-12 rounded-xl bg-warmgray-50 hover:bg-warmgray-100 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-900 dark:text-white text-lg font-bold"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-12 rounded-xl bg-warmgray-50 hover:bg-warmgray-100 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-500 text-xs font-bold"
          >
            Del
          </button>
        </div>

      </div>
    </div>
  );
}
