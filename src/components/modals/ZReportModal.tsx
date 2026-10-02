"use client";

import React from "react";
import { X, Printer, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { ShiftReport } from "@/types";

interface ZReportModalProps {
  isOpen: boolean;
  report: ShiftReport;
  onClose: () => void;
}

export function ZReportModal({ isOpen, report, onClose }: ZReportModalProps) {
  if (!isOpen || !report) return null;

  const { business, shift, summary, cashMovements } = report;
  const currency = business?.currency || "SAR";

  const handlePrint = () => {
    window.print();
  };

  const isOver = (shift.cashVariance || 0) > 0;
  const isShort = (shift.cashVariance || 0) < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-warmgray-100 dark:border-warmgray-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <h3 className="text-base font-black text-warmgray-900 dark:text-white">
              End-of-Shift Z-Report
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-warmgray-100 dark:hover:bg-warmgray-800 text-warmgray-400 hover:text-warmgray-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Area (Print target) */}
        <div className="flex-1 overflow-y-auto py-4">
          <div
            id="z-report-paper"
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
            className="printable-thermal w-full bg-[#FAFAF8] text-[#1C120C] p-5 rounded-2xl border border-warmgray-200 font-mono text-xs shadow-inner space-y-3 print:p-2 print:shadow-none print:border-none print:bg-white print:text-black"
          >
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-base font-black tracking-tight">{business?.nameEn || "Coffee Shop"}</h2>
              <p className="text-[11px] text-warmgray-600">{business?.addressEn || "Main Branch"}</p>
              <p className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/10 text-amber-900 py-0.5 rounded mt-1">
                *** Z-REPORT (DAILY CLOSING) ***
              </p>
            </div>

            <div className="border-t border-dashed border-warmgray-300 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Shift ID:</span>
                <span className="font-bold">#{shift.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span className="font-bold">{shift.cashierName} ({shift.cashierRole})</span>
              </div>
              <div className="flex justify-between">
                <span>Opened:</span>
                <span>{new Date(shift.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex justify-between">
                <span>Closed:</span>
                <span>{shift.closedAt ? new Date(shift.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice Range:</span>
                <span>{summary.firstInvoice} → {summary.lastInvoice}</span>
              </div>
            </div>

            {/* Sales Summary */}
            <div className="border-t border-dashed border-warmgray-300 pt-2 space-y-1.5">
              <p className="font-bold text-[11px] uppercase text-warmgray-700">Sales Summary</p>
              <div className="flex justify-between">
                <span>Total Orders Completed:</span>
                <span className="font-bold">{summary.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span>{summary.subtotal.toFixed(2)} {currency}</span>
              </div>
              {summary.totalDiscounts > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discounts Given:</span>
                  <span>-{summary.totalDiscounts.toFixed(2)} {currency}</span>
                </div>
              )}
              {summary.totalTax > 0 && (
                <div className="flex justify-between">
                  <span>Tax Collected:</span>
                  <span>{summary.totalTax.toFixed(2)} {currency}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-warmgray-200 pt-1">
                <span>NET REVENUE:</span>
                <span>{summary.totalRevenue.toFixed(2)} {currency}</span>
              </div>
            </div>

            {/* Tenders Breakdown */}
            <div className="border-t border-dashed border-warmgray-300 pt-2 space-y-1 text-[11px]">
              <p className="font-bold uppercase text-warmgray-700">Tenders Breakdown</p>
              <div className="flex justify-between">
                <span>Cash Sales:</span>
                <span className="font-bold">{summary.tenders.cash.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Card Sales:</span>
                <span className="font-bold">{summary.tenders.card.toFixed(2)} {currency}</span>
              </div>
              {summary.tenders.other > 0 && (
                <div className="flex justify-between">
                  <span>Other / Split:</span>
                  <span className="font-bold">{summary.tenders.other.toFixed(2)} {currency}</span>
                </div>
              )}
            </div>

            {/* Cash Drawer Reconciliation */}
            <div className="border-t border-dashed border-warmgray-300 pt-2 space-y-1 text-[11px] bg-warmgray-100/60 p-2.5 rounded-xl">
              <p className="font-black uppercase text-warmgray-800">Cash Drawer Audit</p>
              <div className="flex justify-between">
                <span>Starting Cash Float:</span>
                <span>+{summary.cashReconciliation.startFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Sales Taken:</span>
                <span>+{summary.cashReconciliation.cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid In:</span>
                <span>+{summary.cashReconciliation.paidIns.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Paid Out (Petty Cash):</span>
                <span>-{summary.cashReconciliation.paidOuts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-warmgray-300 pt-1">
                <span>System Expected Cash:</span>
                <span>{summary.cashReconciliation.expectedInDrawer.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Physical Count Counted:</span>
                <span>{summary.cashReconciliation.actualCounted.toFixed(2)} {currency}</span>
              </div>
              <div
                className={`flex justify-between font-black text-xs pt-1 border-t ${
                  isShort
                    ? "text-red-600"
                    : isOver
                    ? "text-emerald-700"
                    : "text-warmgray-800"
                }`}
              >
                <span>CASH VARIANCE:</span>
                <span>
                  {summary.cashReconciliation.overShort >= 0
                    ? `+${summary.cashReconciliation.overShort.toFixed(2)}`
                    : summary.cashReconciliation.overShort.toFixed(2)}{" "}
                  {currency} {isShort ? "(SHORT)" : isOver ? "(OVER)" : "(BALANCED)"}
                </span>
              </div>
            </div>

            {/* Notes if present */}
            {shift.notes && (
              <div className="text-[10px] text-warmgray-600 border-t border-dashed border-warmgray-300 pt-2">
                <span className="font-bold">Notes:</span> {shift.notes}
              </div>
            )}

            <div className="text-center pt-2 border-t border-dashed border-warmgray-300 text-[10px] text-warmgray-500">
              End of Report • Saved to Store Audit Ledger
            </div>
          </div>
        </div>

        {/* Bottom Print Buttons */}
        <div className="pt-3 border-t border-warmgray-100 dark:border-warmgray-800 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-warmgray-100 hover:bg-warmgray-200 dark:bg-warmgray-800 text-warmgray-800 dark:text-warmgray-200 font-bold text-xs"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print 80mm Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
