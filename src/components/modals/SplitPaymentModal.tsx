"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Banknote, Smartphone, CheckCircle2, AlertCircle } from "lucide-react";
import { SplitPayment } from "@/types";

interface SplitPaymentModalProps {
  isOpen: boolean;
  totalDue: number;
  currency: string;
  onConfirm: (payments: SplitPayment[]) => void;
  onClose: () => void;
}

export function SplitPaymentModal({
  isOpen,
  totalDue,
  currency,
  onConfirm,
  onClose,
}: SplitPaymentModalProps) {
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [mobileAmount, setMobileAmount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      // Default to 50/50 or start with zero
      setCashAmount(0);
      setCardAmount(0);
      setMobileAmount(0);
    }
  }, [isOpen, totalDue]);

  if (!isOpen) return null;

  const totalPaid = cashAmount + cardAmount + mobileAmount;
  const remaining = Number((totalDue - totalPaid).toFixed(2));
  const isBalanced = Math.abs(remaining) < 0.01;

  const handleFillRemainder = (method: "CASH" | "CARD" | "MOBILE") => {
    const currentPaidExcluding =
      (method === "CASH" ? 0 : cashAmount) +
      (method === "CARD" ? 0 : cardAmount) +
      (method === "MOBILE" ? 0 : mobileAmount);

    const needed = Math.max(0, Number((totalDue - currentPaidExcluding).toFixed(2)));

    if (method === "CASH") setCashAmount(needed);
    else if (method === "CARD") setCardAmount(needed);
    else setMobileAmount(needed);
  };

  const handleSubmit = () => {
    if (!isBalanced) return;

    const payments: SplitPayment[] = [];
    if (cashAmount > 0) payments.push({ paymentMethod: "CASH", amount: cashAmount });
    if (cardAmount > 0) payments.push({ paymentMethod: "CARD", amount: cardAmount });
    if (mobileAmount > 0) payments.push({ paymentMethod: "MOBILE_PAY", amount: mobileAmount });

    onConfirm(payments);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-warmgray-100 dark:border-warmgray-800">
          <div>
            <h3 className="text-base font-black text-warmgray-900 dark:text-white">
              Split Tender Payment
            </h3>
            <p className="text-xs text-warmgray-500">Divide order across multiple payment methods</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-warmgray-100 dark:hover:bg-warmgray-800 text-warmgray-400 hover:text-warmgray-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Due & Remaining Banner */}
        <div className="p-4 rounded-2xl bg-warmgray-50 dark:bg-warmgray-800/60 border border-warmgray-200/60 dark:border-warmgray-700/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-warmgray-500 uppercase">Total Bill Due</span>
            <p className="text-xl font-black text-warmgray-900 dark:text-white">
              {totalDue.toFixed(2)} {currency}
            </p>
          </div>
          <div className="text-end">
            <span className="text-[11px] font-bold text-warmgray-500 uppercase">Remaining Balance</span>
            <p
              className={`text-xl font-black ${
                isBalanced
                  ? "text-emerald-500"
                  : remaining > 0
                  ? "text-amber-500"
                  : "text-red-500"
              }`}
            >
              {remaining.toFixed(2)} {currency}
            </p>
          </div>
        </div>

        {/* Payment Methods Input Rows */}
        <div className="space-y-3">
          {/* 1. Cash */}
          <div className="p-3 rounded-xl border border-warmgray-200 dark:border-warmgray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-warmgray-800 dark:text-warmgray-200">
                Cash Tender
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.5"
                value={cashAmount || ""}
                onChange={(e) => setCashAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0.00"
                className="w-24 px-3 py-1.5 bg-warmgray-100 dark:bg-warmgray-800 rounded-lg text-sm font-black text-end text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={() => handleFillRemainder("CASH")}
                className="text-[10px] font-bold px-2 py-1.5 rounded-lg bg-warmgray-100 hover:bg-warmgray-200 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300"
              >
                Max
              </button>
            </div>
          </div>

          {/* 2. Card */}
          <div className="p-3 rounded-xl border border-warmgray-200 dark:border-warmgray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-warmgray-800 dark:text-warmgray-200">
                Debit/Credit Card
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.5"
                value={cardAmount || ""}
                onChange={(e) => setCardAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0.00"
                className="w-24 px-3 py-1.5 bg-warmgray-100 dark:bg-warmgray-800 rounded-lg text-sm font-black text-end text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={() => handleFillRemainder("CARD")}
                className="text-[10px] font-bold px-2 py-1.5 rounded-lg bg-warmgray-100 hover:bg-warmgray-200 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300"
              >
                Max
              </button>
            </div>
          </div>

          {/* 3. Mobile Pay (Apple Pay / Mada) */}
          <div className="p-3 rounded-xl border border-warmgray-200 dark:border-warmgray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-warmgray-800 dark:text-warmgray-200">
                Apple Pay / Mobile
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.5"
                value={mobileAmount || ""}
                onChange={(e) => setMobileAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0.00"
                className="w-24 px-3 py-1.5 bg-warmgray-100 dark:bg-warmgray-800 rounded-lg text-sm font-black text-end text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={() => handleFillRemainder("MOBILE")}
                className="text-[10px] font-bold px-2 py-1.5 rounded-lg bg-warmgray-100 hover:bg-warmgray-200 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300"
              >
                Max
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isBalanced}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-black text-xs shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
}
