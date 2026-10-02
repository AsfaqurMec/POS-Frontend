"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  Lock,
  ExternalLink,
  History,
} from "lucide-react";
import {
  useCurrentShift,
  useOpenShift,
  useCloseShift,
  useAddCashMovement,
  useBusiness,
} from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { ZReportModal } from "./ZReportModal";

interface ShiftControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShiftControlModal({ isOpen, onClose }: ShiftControlModalProps) {
  const router = useRouter();
  const { data: shiftData, isLoading, refetch } = useCurrentShift();
  const { data: business } = useBusiness();
  const { lang } = useLangStore();

  const openShiftMutation = useOpenShift();
  const closeShiftMutation = useCloseShift();
  const addCashMovementMutation = useAddCashMovement();

  // Mode states: "VIEW", "OPEN", "PAID_IN_OUT", "CLOSE_BLIND"
  const [activeTab, setActiveTab] = useState<"MAIN" | "PAID_MOVE" | "CLOSE">("MAIN");
  const [startFloatInput, setStartFloatInput] = useState<number>(200);

  // Cash movement form
  const [movementType, setMovementType] = useState<"PAID_IN" | "PAID_OUT">("PAID_OUT");
  const [movementAmount, setMovementAmount] = useState<number>(50);
  const [movementReason, setMovementReason] = useState<string>("");

  // Blind close form
  const [actualCashInput, setActualCashInput] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState<string>("");

  // Z-Report display state
  const [zReportData, setZReportData] = useState<any>(null);
  const [isZReportOpen, setIsZReportOpen] = useState(false);

  if (!isOpen) return null;

  const currency = business?.currency || "SAR";
  const currentShift = shiftData?.shift;
  const runningStats = shiftData?.runningStats;

  const handleOpenShift = async () => {
    try {
      await openShiftMutation.mutateAsync(startFloatInput);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMovement = async () => {
    if (!currentShift || !movementReason.trim() || movementAmount <= 0) return;
    try {
      await addCashMovementMutation.mutateAsync({
        shiftId: currentShift.id,
        type: movementType,
        amount: movementAmount,
        reason: movementReason.trim(),
      });
      setMovementReason("");
      setActiveTab("MAIN");
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    try {
      const res = await closeShiftMutation.mutateAsync({
        shiftId: currentShift.id,
        actualCash: actualCashInput,
        notes: closingNotes,
      });
      setZReportData(res.report);
      setIsZReportOpen(true);
      setActiveTab("MAIN");
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-lg bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-warmgray-100 dark:border-warmgray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-warmgray-900 dark:text-white">
                  Cash Drawer & Shift Controls
                </h3>
                <p className="text-xs text-warmgray-500 font-medium">
                  {currentShift ? `Shift #${currentShift.id.slice(0, 8)} • Active` : "No Active Shift"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-warmgray-100 dark:hover:bg-warmgray-800 text-warmgray-400 hover:text-warmgray-700 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          {isLoading ? (
            <div className="py-12 text-center text-warmgray-400 text-sm">Loading shift status...</div>
          ) : !currentShift ? (
            /* 1. NO SHIFT OPEN: PROMPT TO OPEN WITH FLOAT */
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-warmgray-900 dark:text-white">
                  Open Register Shift
                </h4>
                <p className="text-xs text-warmgray-500 mt-1 max-w-xs mx-auto">
                  Enter the starting physical cash float placed into the cash drawer to unlock register sales.
                </p>
              </div>

              <div className="space-y-3 max-w-xs mx-auto text-start">
                <label className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                  Starting Cash Float ({currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={startFloatInput}
                    onChange={(e) => setStartFloatInput(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-3 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl font-black text-lg text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="absolute end-4 top-3.5 text-xs font-bold text-warmgray-400">
                    {currency}
                  </span>
                </div>

                {/* Quick denomination chips */}
                <div className="flex gap-2">
                  {[100, 200, 300, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setStartFloatInput(amt)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border ${
                        startFloatInput === amt
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-600 dark:text-warmgray-300 border-warmgray-200 dark:border-warmgray-700"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleOpenShift}
                disabled={openShiftMutation.isPending}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{openShiftMutation.isPending ? "Opening Shift..." : "Open Register & Start Shift"}</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/shifts");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-warmgray-500 hover:text-warmgray-700 dark:hover:text-warmgray-300 font-medium"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Previous Shift History</span>
                </button>
              </div>
            </div>
          ) : activeTab === "MAIN" ? (
            /* 2. ACTIVE SHIFT DASHBOARD */
            <div className="space-y-5">
              {/* Running Cash Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-warmgray-50 dark:bg-warmgray-800/60 rounded-2xl border border-warmgray-100 dark:border-warmgray-700/50">
                  <span className="text-[11px] font-bold text-warmgray-500 uppercase tracking-wider">
                    Starting Float
                  </span>
                  <p className="text-lg font-black text-warmgray-900 dark:text-white mt-1">
                    {currentShift.startFloat.toFixed(2)} {currency}
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    Expected Cash in Till
                  </span>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {(runningStats?.expectedCashInDrawer || currentShift.startFloat).toFixed(2)} {currency}
                  </p>
                </div>

                <div className="p-3 bg-warmgray-50 dark:bg-warmgray-800/60 rounded-xl border border-warmgray-100 dark:border-warmgray-700/50">
                  <span className="text-[10px] font-bold text-warmgray-500">Cash Sales:</span>
                  <p className="text-sm font-bold text-warmgray-800 dark:text-warmgray-200 mt-0.5">
                    {(runningStats?.cashSales || 0).toFixed(2)} {currency}
                  </p>
                </div>

                <div className="p-3 bg-warmgray-50 dark:bg-warmgray-800/60 rounded-xl border border-warmgray-100 dark:border-warmgray-700/50">
                  <span className="text-[10px] font-bold text-warmgray-500">Card Sales:</span>
                  <p className="text-sm font-bold text-warmgray-800 dark:text-warmgray-200 mt-0.5">
                    {(runningStats?.cardSales || 0).toFixed(2)} {currency}
                  </p>
                </div>
              </div>

              {/* Paid In / Paid Out Summary */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-warmgray-100/70 dark:bg-warmgray-800/40 text-xs font-medium">
                <span className="text-warmgray-600 dark:text-warmgray-400">
                  Petty Cash Movements:
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600 font-bold">
                    +{runningStats?.paidIns.toFixed(2)} {currency}
                  </span>
                  <span className="text-red-500 font-bold">
                    -{runningStats?.paidOuts.toFixed(2)} {currency}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setActiveTab("PAID_MOVE")}
                  className="py-3 px-4 rounded-xl bg-warmgray-100 hover:bg-warmgray-200 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-900 dark:text-white font-bold text-xs transition flex items-center justify-center gap-2 border border-warmgray-200 dark:border-warmgray-700"
                >
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span>Paid In / Paid Out</span>
                </button>

                <button
                  onClick={() => {
                    setActualCashInput(runningStats?.expectedCashInDrawer || 0);
                    setActiveTab("CLOSE");
                  }}
                  className="py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-bold text-xs transition flex items-center justify-center gap-2 border border-red-200 dark:border-red-800"
                >
                  <FileText className="w-4 h-4" />
                  <span>Close Shift & Z-Report</span>
                </button>
              </div>

              {/* Navigation to Full Shift Details & History */}
              <div className="pt-3 border-t border-warmgray-100 dark:border-warmgray-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/shifts/${currentShift.id}`);
                  }}
                  className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Shift Details Page</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/shifts");
                  }}
                  className="inline-flex items-center gap-1.5 text-warmgray-500 hover:text-warmgray-700 dark:hover:text-warmgray-300 font-medium"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Shift History</span>
                </button>
              </div>
            </div>
          ) : activeTab === "PAID_MOVE" ? (
            /* 3. RECORD PETTY CASH (PAID IN / PAID OUT) */
            <div className="space-y-4">
              <div className="flex rounded-xl bg-warmgray-100 dark:bg-warmgray-800 p-1">
                <button
                  onClick={() => setMovementType("PAID_OUT")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    movementType === "PAID_OUT"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-warmgray-600 dark:text-warmgray-400"
                  }`}
                >
                  Paid Out (Withdrawal)
                </button>
                <button
                  onClick={() => setMovementType("PAID_IN")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    movementType === "PAID_IN"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-warmgray-600 dark:text-warmgray-400"
                  }`}
                >
                  Paid In (Addition)
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                  Amount ({currency})
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl font-bold text-warmgray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                  Reason / Purpose (e.g. Ice delivery, milk cartons)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Ice bag purchase"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-warmgray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setActiveTab("MAIN")}
                  className="flex-1 py-2.5 rounded-xl bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 text-xs font-bold"
                >
                  Back
                </button>
                <button
                  onClick={handleAddMovement}
                  disabled={!movementReason.trim() || movementAmount <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
                >
                  Record Transaction
                </button>
              </div>
            </div>
          ) : (
            /* 4. BLIND CASH RECONCILIATION & CLOSE */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  Count all physical notes and coins in the drawer. The system will compare your physical count against expected sales and generate the Z-Report.
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                  Physical Cash Counted ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-3 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl font-black text-xl text-warmgray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                  Closing Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Any explanations for cash variance or handover notes..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-warmgray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setActiveTab("MAIN")}
                  className="flex-1 py-3 rounded-xl bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 text-xs font-bold"
                >
                  Back
                </button>
                <button
                  onClick={handleCloseShift}
                  disabled={closeShiftMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/20"
                >
                  {closeShiftMutation.isPending ? "Closing..." : "Submit Count & Close"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Z-Report Modal */}
      {zReportData && (
        <ZReportModal
          isOpen={isZReportOpen}
          report={zReportData}
          onClose={() => {
            setIsZReportOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
