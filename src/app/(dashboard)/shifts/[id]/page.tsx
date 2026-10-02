"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Coins,
  ArrowLeft,
  ArrowRight,
  Printer,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Banknote,
  Receipt,
  FileText,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  ShoppingBag,
  Info,
} from "lucide-react";
import { useShift } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { ZReportModal } from "@/components/modals/ZReportModal";
import { ShiftReport } from "@/types";

export default function ShiftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { lang, t, dir } = useLangStore();

  const [activeTab, setActiveTab] = useState<"AUDIT" | "MOVEMENTS" | "SALES">("AUDIT");
  const [isZReportModalOpen, setIsZReportModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useShift(id);

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-16">
        <div className="h-8 w-44 bg-warmgray-200 dark:bg-warmgray-800 rounded-xl animate-pulse" />
        <div className="h-40 bg-warmgray-200 dark:bg-warmgray-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-warmgray-200 dark:bg-warmgray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-warmgray-200 dark:bg-warmgray-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-4 min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-warmgray-900 dark:text-white">
          Shift record not found
        </h2>
        <p className="text-xs text-warmgray-500">
          The requested shift ID could not be loaded or may have been deleted.
        </p>
        <Link
          href="/shifts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md hover:bg-amber-700 transition"
        >
          <BackArrow className="w-4 h-4" />
          <span>{t.shifts.backToShifts}</span>
        </Link>
      </div>
    );
  }

  const { shift, business, summary, cashMovements, sales } = data;
  const currency = business?.currency || "SAR";
  const isOpen = shift.status === "OPEN";

  // Calculate duration
  const openedDate = new Date(shift.openedAt);
  const closedDate = shift.closedAt ? new Date(shift.closedAt) : new Date();
  const diffMs = Math.max(0, closedDate.getTime() - openedDate.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const durationStr = `${diffHours}h ${diffMins}m`;

  const isOver = (summary?.cashReconciliation?.overShort || 0) > 0;
  const isShort = (summary?.cashReconciliation?.overShort || 0) < 0;

  // Construct ShiftReport object for ZReportModal
  const shiftReportObj: ShiftReport = {
    business,
    shift: {
      id: shift.id,
      status: shift.status,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      cashierName: shift.user?.name || "Cashier",
      cashierRole: shift.user?.role || ("CASHIER" as any),
      startFloat: shift.startFloat,
      expectedCash: summary?.cashReconciliation?.expectedInDrawer || shift.expectedCash || 0,
      actualCash: summary?.cashReconciliation?.actualCounted || shift.actualCash || 0,
      cashVariance: summary?.cashReconciliation?.overShort || shift.cashVariance || 0,
      notes: shift.notes,
    },
    summary: {
      totalOrders: summary.totalOrders,
      firstInvoice: summary.firstInvoice,
      lastInvoice: summary.lastInvoice,
      subtotal: summary.subtotal,
      totalDiscounts: summary.totalDiscounts,
      totalTax: summary.totalTax,
      totalRevenue: summary.totalRevenue,
      tenders: summary.tenders,
      cashReconciliation: summary.cashReconciliation,
    },
    cashMovements,
  };

  const handlePrintFullReport = () => {
    window.print();
  };

  return (
    <>
      <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-16 print:hidden">
        {/* Navigation & Actions Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/shifts"
              className="p-2 rounded-xl border border-warmgray-200 dark:border-warmgray-800 bg-white dark:bg-warmgray-900 text-warmgray-600 dark:text-warmgray-300 hover:text-amber-600 transition"
              title={t.shifts.backToShifts}
            >
              <BackArrow className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-warmgray-900 dark:text-white tracking-tight">
                  {t.shifts.shiftDetails}
                </h1>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                  #{shift.id.slice(0, 8)}
                </span>
                {isOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t.shifts.activeShift}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-warmgray-100 text-warmgray-700 dark:bg-warmgray-800 dark:text-warmgray-300">
                    {t.shifts.closedShift}
                  </span>
                )}
              </div>
              <p className="text-xs text-warmgray-500 mt-0.5">
                Cashier: <strong className="text-warmgray-800 dark:text-warmgray-200">{shift.user?.name}</strong> (
                {shift.user?.role}) • Duration: {durationStr}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => refetch()}
              className="p-2.5 rounded-xl border border-warmgray-200 dark:border-warmgray-800 bg-white dark:bg-warmgray-900 text-warmgray-600 dark:text-warmgray-300 hover:text-amber-600 transition"
              title="Refresh Shift Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Print 80mm Z-Report Slip Modal */}
            <button
              onClick={() => setIsZReportModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-lg shadow-amber-600/20 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{t.shifts.printReport} (80mm)</span>
            </button>

            {/* Print Full Summary Report */}
            <button
              onClick={handlePrintFullReport}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-900 hover:bg-warmgray-50 dark:hover:bg-warmgray-800 text-warmgray-800 dark:text-warmgray-200 text-xs font-bold transition shadow-xs active:scale-95"
            >
              <FileText className="w-4 h-4 text-warmgray-500" />
              <span>{t.shifts.printFullReport}</span>
            </button>
          </div>
        </div>

        {/* Shift Timing and Metadata Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-warmgray-400 tracking-wider">
                {t.shifts.openedAt}
              </span>
              <p className="font-bold text-warmgray-800 dark:text-warmgray-200">
                {new Date(shift.openedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-warmgray-400 tracking-wider">
                {t.shifts.closedAt}
              </span>
              <p className="font-bold text-warmgray-800 dark:text-warmgray-200">
                {shift.closedAt ? new Date(shift.closedAt).toLocaleString() : "Currently Active"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-warmgray-400 tracking-wider">
                {t.shifts.invoiceRange}
              </span>
              <p className="font-bold text-warmgray-800 dark:text-warmgray-200 truncate">
                {summary.firstInvoice} → {summary.lastInvoice}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-warmgray-400 tracking-wider">
                Cashier Email
              </span>
              <p className="font-bold text-warmgray-800 dark:text-warmgray-200 truncate">
                {shift.user?.email || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Handover / Closing Notes if present */}
        {shift.notes && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-900 dark:text-amber-200 font-bold">Cashier Closing Notes: </strong>
              <span className="text-amber-800 dark:text-amber-300">{shift.notes}</span>
            </div>
          </div>
        )}

        {/* KPI Financial Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Starting Float */}
          <div className="p-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-warmgray-500 uppercase tracking-wider">
              {t.shifts.startingFloat}
            </span>
            <p className="text-xl sm:text-2xl font-black text-warmgray-900 dark:text-white mt-1.5">
              {shift.startFloat.toFixed(2)} <span className="text-xs font-normal">{currency}</span>
            </p>
            <p className="text-[10px] text-warmgray-400 mt-1">Opening till balance</p>
          </div>

          {/* Net Sales Revenue */}
          <div className="p-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-warmgray-500 uppercase tracking-wider">
              {t.shifts.netRevenue}
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
              {summary.totalRevenue.toFixed(2)} <span className="text-xs font-normal">{currency}</span>
            </p>
            <p className="text-[10px] text-warmgray-400 mt-1">{summary.totalOrders} completed orders</p>
          </div>

          {/* System Expected Cash in Drawer */}
          <div className="p-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-warmgray-500 uppercase tracking-wider">
              {t.shifts.expectedCash}
            </span>
            <p className="text-xl sm:text-2xl font-black text-warmgray-900 dark:text-white mt-1.5">
              {summary.cashReconciliation.expectedInDrawer.toFixed(2)}{" "}
              <span className="text-xs font-normal">{currency}</span>
            </p>
            <p className="text-[10px] text-warmgray-400 mt-1">Float + Cash sales ± Petty cash</p>
          </div>

          {/* Physical Cash Counted */}
          <div className="p-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-warmgray-500 uppercase tracking-wider">
              {t.shifts.actualCash}
            </span>
            <p className="text-xl sm:text-2xl font-black text-warmgray-900 dark:text-white mt-1.5">
              {shift.actualCash != null ? (
                <>
                  {shift.actualCash.toFixed(2)} <span className="text-xs font-normal">{currency}</span>
                </>
              ) : (
                <span className="text-base text-warmgray-400 italic">Not closed yet</span>
              )}
            </p>
            <p className="text-[10px] text-warmgray-400 mt-1">Physical drawer audit</p>
          </div>

          {/* Cash Variance */}
          <div className="p-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold text-warmgray-500 uppercase tracking-wider">
              {t.shifts.cashVariance}
            </span>
            <p
              className={`text-xl sm:text-2xl font-black mt-1.5 ${
                isShort
                  ? "text-red-500"
                  : isOver
                  ? "text-emerald-500"
                  : "text-warmgray-900 dark:text-white"
              }`}
            >
              {summary.cashReconciliation.overShort >= 0
                ? `+${summary.cashReconciliation.overShort.toFixed(2)}`
                : summary.cashReconciliation.overShort.toFixed(2)}{" "}
              <span className="text-xs font-normal">{currency}</span>
            </p>
            <p className="text-[10px] font-bold mt-1">
              {isShort ? (
                <span className="text-red-500">Short (Deficit in till)</span>
              ) : isOver ? (
                <span className="text-emerald-500">Over (Excess in till)</span>
              ) : (
                <span className="text-warmgray-500">Drawer Balanced</span>
              )}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-warmgray-200 dark:border-warmgray-800 gap-2">
          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`py-2.5 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === "AUDIT"
                ? "border-amber-600 text-amber-600 dark:text-amber-400"
                : "border-transparent text-warmgray-500 hover:text-warmgray-800 dark:hover:text-white"
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{t.shifts.reconciliation}</span>
          </button>

          <button
            onClick={() => setActiveTab("MOVEMENTS")}
            className={`py-2.5 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === "MOVEMENTS"
                ? "border-amber-600 text-amber-600 dark:text-amber-400"
                : "border-transparent text-warmgray-500 hover:text-warmgray-800 dark:hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>
              {t.shifts.pettyCash} ({cashMovements.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("SALES")}
            className={`py-2.5 px-4 font-bold text-xs border-b-2 transition flex items-center gap-2 ${
              activeTab === "SALES"
                ? "border-amber-600 text-amber-600 dark:text-amber-400"
                : "border-transparent text-warmgray-500 hover:text-warmgray-800 dark:hover:text-white"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {t.shifts.salesList} ({sales.length})
            </span>
          </button>
        </div>

        {/* Tab 1: Reconciliation & Tenders Breakdown */}
        {activeTab === "AUDIT" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Step-by-Step Cash Drawer Audit */}
            <div className="p-5 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-warmgray-100 dark:border-warmgray-800">
                <h3 className="text-sm font-black text-warmgray-900 dark:text-white uppercase tracking-wider">
                  Cash Drawer Audit
                </h3>
                <span className="text-xs text-warmgray-400 font-mono">Mathematical Verification</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-warmgray-50 dark:border-warmgray-800">
                  <span className="text-warmgray-600 dark:text-warmgray-400">Starting Cash Float:</span>
                  <span className="font-bold text-warmgray-900 dark:text-white">
                    +{summary.cashReconciliation.startFloat.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-warmgray-50 dark:border-warmgray-800">
                  <span className="text-warmgray-600 dark:text-warmgray-400">Cash Received from Sales:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{summary.cashReconciliation.cashSales.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-warmgray-50 dark:border-warmgray-800">
                  <span className="text-warmgray-600 dark:text-warmgray-400">Petty Cash In (Paid In):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{summary.cashReconciliation.paidIns.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-warmgray-50 dark:border-warmgray-800">
                  <span className="text-warmgray-600 dark:text-warmgray-400">Petty Cash Out (Paid Out):</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    -{summary.cashReconciliation.paidOuts.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-t border-b-2 border-warmgray-200 dark:border-warmgray-700 font-bold text-sm bg-warmgray-50 dark:bg-warmgray-800/50 px-2 rounded-lg">
                  <span className="text-warmgray-800 dark:text-warmgray-200">System Expected in Drawer:</span>
                  <span className="text-warmgray-900 dark:text-white">
                    {summary.cashReconciliation.expectedInDrawer.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 px-2">
                  <span className="text-warmgray-600 dark:text-warmgray-400 font-bold">Physical Cash Counted:</span>
                  <span className="font-black text-warmgray-900 dark:text-white text-sm">
                    {summary.cashReconciliation.actualCounted.toFixed(2)} {currency}
                  </span>
                </div>

                <div
                  className={`flex justify-between py-2.5 px-3 rounded-xl border text-sm font-black ${
                    isShort
                      ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                      : isOver
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                      : "bg-warmgray-100 dark:bg-warmgray-800 border-warmgray-200 dark:border-warmgray-700 text-warmgray-800 dark:text-warmgray-200"
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
            </div>

            {/* Sales & Tenders Breakdown */}
            <div className="p-5 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-warmgray-100 dark:border-warmgray-800">
                <h3 className="text-sm font-black text-warmgray-900 dark:text-white uppercase tracking-wider">
                  Tenders & Revenue Breakdown
                </h3>
                <span className="text-xs text-warmgray-400 font-mono">Payment Channels</span>
              </div>

              <div className="space-y-3">
                {/* Cash Sales Card */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-warmgray-50 dark:bg-warmgray-800/60 border border-warmgray-100 dark:border-warmgray-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-warmgray-800 dark:text-warmgray-200">
                        {t.shifts.tenderCash}
                      </p>
                      <p className="text-[10px] text-warmgray-400">Physical bank notes</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-warmgray-900 dark:text-white">
                    {summary.tenders.cash.toFixed(2)} {currency}
                  </span>
                </div>

                {/* Card Sales Card */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-warmgray-50 dark:bg-warmgray-800/60 border border-warmgray-100 dark:border-warmgray-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-warmgray-800 dark:text-warmgray-200">
                        {t.shifts.tenderCard}
                      </p>
                      <p className="text-[10px] text-warmgray-400">POS Card Machine / Terminal</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-warmgray-900 dark:text-white">
                    {summary.tenders.card.toFixed(2)} {currency}
                  </span>
                </div>

                {/* Other Sales Card */}
                {summary.tenders.other > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-warmgray-50 dark:bg-warmgray-800/60 border border-warmgray-100 dark:border-warmgray-700/60">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-warmgray-800 dark:text-warmgray-200">
                          {t.shifts.tenderOther}
                        </p>
                        <p className="text-[10px] text-warmgray-400">Split or digital mobile payments</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-warmgray-900 dark:text-white">
                      {summary.tenders.other.toFixed(2)} {currency}
                    </span>
                  </div>
                )}

                {/* Financial Summary Totals */}
                <div className="pt-2 border-t border-warmgray-100 dark:border-warmgray-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-warmgray-600 dark:text-warmgray-400">
                    <span>{t.shifts.grossSales}:</span>
                    <span className="font-bold">{summary.subtotal.toFixed(2)} {currency}</span>
                  </div>
                  {summary.totalDiscounts > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Total Discounts:</span>
                      <span className="font-bold">-{summary.totalDiscounts.toFixed(2)} {currency}</span>
                    </div>
                  )}
                  {summary.totalTax > 0 && (
                    <div className="flex justify-between text-warmgray-600 dark:text-warmgray-400">
                      <span>Total VAT Tax:</span>
                      <span className="font-bold">+{summary.totalTax.toFixed(2)} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-warmgray-200 dark:border-warmgray-700 text-sm font-black text-warmgray-900 dark:text-white">
                    <span>{t.shifts.netRevenue}:</span>
                    <span>{summary.totalRevenue.toFixed(2)} {currency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Petty Cash Movements */}
        {activeTab === "MOVEMENTS" && (
          <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-warmgray-100 dark:border-warmgray-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-warmgray-900 dark:text-white">
                Petty Cash Paid-In / Paid-Out Records
              </h3>
              <span className="text-xs text-warmgray-400">{cashMovements.length} transactions recorded</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-warmgray-200 dark:border-warmgray-800 bg-warmgray-50/70 dark:bg-warmgray-800/40 text-warmgray-600 dark:text-warmgray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 text-start">Type</th>
                    <th className="py-3 px-4 text-start">Amount</th>
                    <th className="py-3 px-4 text-start">Reason / Memo</th>
                    <th className="py-3 px-4 text-start">Authorized User</th>
                    <th className="py-3 px-4 text-end">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800 font-medium">
                  {cashMovements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-warmgray-400">
                        No cash movements recorded during this shift.
                      </td>
                    </tr>
                  ) : (
                    cashMovements.map((cm) => {
                      const isPaidIn = cm.type === "PAID_IN";
                      return (
                        <tr key={cm.id} className="hover:bg-warmgray-50/80 dark:hover:bg-warmgray-800/40">
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                isPaidIn
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                  : "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200 dark:border-red-800"
                              }`}
                            >
                              {isPaidIn ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              <span>{isPaidIn ? t.shifts.paidIn : t.shifts.paidOut}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-sm">
                            <span className={isPaidIn ? "text-emerald-600" : "text-red-600"}>
                              {isPaidIn ? "+" : "-"}
                              {cm.amount.toFixed(2)} {currency}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-warmgray-800 dark:text-warmgray-200">
                            {cm.reason}
                          </td>
                          <td className="py-3.5 px-4 text-warmgray-600 dark:text-warmgray-400">
                            {cm.user?.name || "Cashier"}
                          </td>
                          <td className="py-3.5 px-4 text-end text-warmgray-500 font-mono text-[11px]">
                            {new Date(cm.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Orders & Sales Completed during Shift */}
        {activeTab === "SALES" && (
          <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-warmgray-100 dark:border-warmgray-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-warmgray-900 dark:text-white">
                Orders Completed During Shift
              </h3>
              <span className="text-xs text-warmgray-400">{sales.length} orders total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-warmgray-200 dark:border-warmgray-800 bg-warmgray-50/70 dark:bg-warmgray-800/40 text-warmgray-600 dark:text-warmgray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 text-start">Invoice / Order</th>
                    <th className="py-3 px-4 text-start">Customer</th>
                    <th className="py-3 px-4 text-start">Order Type</th>
                    <th className="py-3 px-4 text-start">Items</th>
                    <th className="py-3 px-4 text-start">Payment</th>
                    <th className="py-3 px-4 text-end">Total Amount</th>
                    <th className="py-3 px-4 text-start">Status</th>
                    <th className="py-3 px-4 text-end">Time</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800 font-medium">
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-warmgray-400">
                        No sales orders were completed during this shift.
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-warmgray-50/80 dark:hover:bg-warmgray-800/40">
                        {/* Invoice & Order # */}
                        <td className="py-3 px-4 font-mono">
                          <Link
                            href={`/orders/${sale.id}`}
                            className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
                          >
                            {sale.invoice?.invoiceNumber || `#${sale.id.slice(0, 8)}`}
                          </Link>
                          {sale.orderNumber && (
                            <div className="text-[10px] text-warmgray-400">#{sale.orderNumber}</div>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4 text-warmgray-800 dark:text-warmgray-200">
                          {sale.customerName || "Walk-in Guest"}
                        </td>

                        {/* Order Type */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300">
                            {sale.orderType}
                          </span>
                        </td>

                        {/* Items */}
                        <td className="py-3 px-4 text-warmgray-600 dark:text-warmgray-400">
                          {sale.items?.length || 0} {sale.items?.length === 1 ? "item" : "items"}
                        </td>

                        {/* Payment */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-warmgray-800 dark:text-warmgray-200">
                            {sale.paymentMethod}
                          </span>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-4 text-end font-bold text-warmgray-900 dark:text-white font-mono">
                          {sale.totalAmount.toFixed(2)} {currency}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sale.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                                : sale.status === "CANCELLED"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                            }`}
                          >
                            {sale.status}
                          </span>
                        </td>

                        {/* Time */}
                        <td className="py-3 px-4 text-end text-warmgray-500 font-mono text-[11px]">
                          {new Date(sale.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Link to Order */}
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/orders/${sale.id}`}
                            className="p-1 rounded-lg text-warmgray-400 hover:text-amber-600 transition inline-flex items-center"
                            title="View Full Order"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Printable Full Page Shift Summary Report (Shown only on print) */}
      <div
        id="printable-shift-report"
        className="printable-full-report hidden print:block bg-white text-black p-6 font-sans text-xs space-y-6"
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">{business?.nameEn || "Store POS"}</h1>
            <p className="text-xs text-gray-600">{business?.addressEn || "Main Store Branch"}</p>
            {business?.phone && <p className="text-xs text-gray-600">Tel: {business.phone}</p>}
          </div>
          <div className="text-end">
            <h2 className="text-base font-black tracking-wide uppercase">Shift Summary Report</h2>
            <p className="text-xs font-mono font-bold">Shift #{shift.id.slice(0, 8)}</p>
            <p className="text-[10px] text-gray-500">Printed: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 border-b border-gray-300 pb-4 text-xs font-mono">
          <div>
            <p><strong>Cashier:</strong> {shift.user?.name} ({shift.user?.role})</p>
            <p><strong>Opened:</strong> {new Date(shift.openedAt).toLocaleString()}</p>
            <p><strong>Closed:</strong> {shift.closedAt ? new Date(shift.closedAt).toLocaleString() : "Active"}</p>
          </div>
          <div>
            <p><strong>Duration:</strong> {durationStr}</p>
            <p><strong>Invoice Range:</strong> {summary.firstInvoice} → {summary.lastInvoice}</p>
            <p><strong>Total Orders:</strong> {summary.totalOrders}</p>
          </div>
        </div>

        {/* Sales & Tenders Table */}
        <div>
          <h3 className="font-black text-xs uppercase mb-2">1. Sales & Revenue</h3>
          <table className="w-full border-collapse border border-gray-300 text-xs">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-2">Gross Subtotal</td>
                <td className="p-2 text-end font-mono">{summary.subtotal.toFixed(2)} {currency}</td>
              </tr>
              {summary.totalDiscounts > 0 && (
                <tr className="border-b border-gray-200 text-red-600">
                  <td className="p-2">Total Discounts</td>
                  <td className="p-2 text-end font-mono">-{summary.totalDiscounts.toFixed(2)} {currency}</td>
                </tr>
              )}
              <tr className="border-b border-gray-200">
                <td className="p-2">Total Tax / VAT</td>
                <td className="p-2 text-end font-mono">+{summary.totalTax.toFixed(2)} {currency}</td>
              </tr>
              <tr className="border-b-2 border-black font-black bg-gray-50">
                <td className="p-2">NET SALES REVENUE</td>
                <td className="p-2 text-end font-mono">{summary.totalRevenue.toFixed(2)} {currency}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-2 ps-4 text-gray-600">• Cash Sales</td>
                <td className="p-2 text-end font-mono">{summary.tenders.cash.toFixed(2)} {currency}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-2 ps-4 text-gray-600">• Card Sales</td>
                <td className="p-2 text-end font-mono">{summary.tenders.card.toFixed(2)} {currency}</td>
              </tr>
              {summary.tenders.other > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="p-2 ps-4 text-gray-600">• Other / Split Sales</td>
                  <td className="p-2 text-end font-mono">{summary.tenders.other.toFixed(2)} {currency}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cash Drawer Audit Table */}
        <div>
          <h3 className="font-black text-xs uppercase mb-2">2. Cash Drawer Reconciliation</h3>
          <table className="w-full border-collapse border border-gray-300 text-xs font-mono">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="p-2">Starting Cash Float</td>
                <td className="p-2 text-end">+{summary.cashReconciliation.startFloat.toFixed(2)} {currency}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-2">Cash Collected from Sales</td>
                <td className="p-2 text-end">+{summary.cashReconciliation.cashSales.toFixed(2)} {currency}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-2">Paid In (Additions to Till)</td>
                <td className="p-2 text-end">+{summary.cashReconciliation.paidIns.toFixed(2)} {currency}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="p-2">Paid Out (Petty Cash Expenses)</td>
                <td className="p-2 text-end">-{summary.cashReconciliation.paidOuts.toFixed(2)} {currency}</td>
              </tr>
              <tr className="border-b border-black font-bold bg-gray-50">
                <td className="p-2">System Expected Cash in Drawer</td>
                <td className="p-2 text-end">{summary.cashReconciliation.expectedInDrawer.toFixed(2)} {currency}</td>
              </tr>
              <tr className="border-b border-black font-bold">
                <td className="p-2">Physical Cash Counted</td>
                <td className="p-2 text-end">{summary.cashReconciliation.actualCounted.toFixed(2)} {currency}</td>
              </tr>
              <tr className="font-black text-sm bg-gray-100">
                <td className="p-2">CASH VARIANCE (OVER / SHORT)</td>
                <td className="p-2 text-end">
                  {summary.cashReconciliation.overShort >= 0
                    ? `+${summary.cashReconciliation.overShort.toFixed(2)}`
                    : summary.cashReconciliation.overShort.toFixed(2)}{" "}
                  {currency}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes if any */}
        {shift.notes && (
          <div className="border border-gray-300 p-3 rounded text-xs">
            <span className="font-bold">Closing Notes:</span> {shift.notes}
          </div>
        )}

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-xs border-t border-gray-300">
          <div className="space-y-8">
            <p className="font-bold">Cashier Signature:</p>
            <div className="border-b border-black w-48" />
            <p className="text-[10px] text-gray-500">{shift.user?.name}</p>
          </div>
          <div className="space-y-8">
            <p className="font-bold">Store Manager Signature:</p>
            <div className="border-b border-black w-48" />
            <p className="text-[10px] text-gray-500">Authorized Auditor</p>
          </div>
        </div>
      </div>

      {/* Printable 80mm Z-Report Slip Modal */}
      <ZReportModal
        isOpen={isZReportModalOpen}
        report={shiftReportObj}
        onClose={() => setIsZReportModalOpen(false)}
      />
    </>
  );
}
