"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Coins,
  Search,
  Printer,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  User,
  Plus,
  RefreshCw,
  DollarSign,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useShifts, useCurrentShift, useBusiness } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { useAuthStore } from "@/store/authStore";
import { Pagination } from "@/components/common/Pagination";
import { ShiftControlModal } from "@/components/modals/ShiftControlModal";
import { ZReportModal } from "@/components/modals/ZReportModal";
import { api } from "@/lib/api";
import { ShiftReport } from "@/types";

export default function ShiftsPage() {
  const { lang, t, dir } = useLangStore();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";
  const { data: business } = useBusiness();
  const currency = business?.currency || "SAR";

  const { data: currentShiftData, refetch: refetchCurrentShift } = useCurrentShift();
  const currentShift = currentShiftData?.shift;

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");

  // Modals state
  const [isControlModalOpen, setIsControlModalOpen] = useState(false);
  const [selectedZReport, setSelectedZReport] = useState<ShiftReport | null>(null);
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);

  // Date range calculated from preset
  const dateRange = useMemo(() => {
    const now = new Date();
    if (dateFilter === "TODAY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: new Date().toISOString() };
    }
    if (dateFilter === "YESTERDAY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (dateFilter === "LAST_7_DAYS") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: new Date().toISOString() };
    }
    if (dateFilter === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString(), endDate: new Date().toISOString() };
    }
    return { startDate: undefined, endDate: undefined };
  }, [dateFilter]);

  const { data, isLoading, refetch } = useShifts(page, pageSize, {
    status: statusFilter,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    search: searchTerm.trim() || undefined,
  });

  const shifts = data?.shifts || [];
  const totalCount = data?.pagination?.total || 0;
  const stats = data?.stats || {
    totalShifts: 0,
    openShifts: 0,
    closedShifts: 0,
    totalRevenue: 0,
    totalVariance: 0,
  };

  const handlePrintReport = async (shiftId: string) => {
    try {
      setLoadingReportId(shiftId);
      const report = await api.get<ShiftReport>(`/shifts/${shiftId}/report`);
      setSelectedZReport(report);
      setIsZReportOpen(true);
    } catch (err) {
      console.error("Failed to load shift report:", err);
    } finally {
      setLoadingReportId(null);
    }
  };

  const isFiltered = searchTerm.trim() !== "" || statusFilter !== "ALL" || dateFilter !== "ALL";

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDateFilter("ALL");
    setPage(1);
  };

  const NextArrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-warmgray-900 dark:text-white tracking-tight">
                {t.shifts.title}
              </h1>
              <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mt-0.5">
                {t.shifts.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-warmgray-200 dark:border-warmgray-800 bg-white dark:bg-warmgray-900 text-warmgray-600 dark:text-warmgray-300 hover:text-amber-600 transition"
            title="Refresh shifts list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {!isGuest && (
            <button
              onClick={() => setIsControlModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition shadow-lg shadow-amber-600/20 active:scale-95"
            >
              {currentShift ? (
                <>
                  <Coins className="w-4 h-4" />
                  <span>Drawer Controls</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{t.shifts.openShift}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Banner (if open) */}
      {currentShift && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-warmgray-900 border border-emerald-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {t.shifts.activeShift}
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  #{currentShift.id.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-warmgray-300 mt-0.5">
                Cashier: <strong className="text-white">{currentShift.user?.name}</strong> • Started at{" "}
                {new Date(currentShift.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="text-end">
              <span className="text-[10px] text-warmgray-400 font-bold uppercase tracking-wider">
                Current Till Float
              </span>
              <p className="text-sm font-black text-emerald-400">
                {(currentShiftData?.runningStats?.expectedCashInDrawer || currentShift.startFloat).toFixed(2)} {currency}
              </p>
            </div>
            <Link
              href={`/shifts/${currentShift.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-200 text-xs font-bold transition"
            >
              <span>{t.shifts.shiftDetails}</span>
              <NextArrow className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Shifts */}
        <div className="p-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-warmgray-500 text-xs font-semibold">
            <span>{t.shifts.allShifts}</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-warmgray-900 dark:text-white mt-2">
            {stats.totalShifts}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold">
            <span className="text-emerald-500">{stats.openShifts} Open</span>
            <span className="text-warmgray-400">•</span>
            <span className="text-warmgray-500">{stats.closedShifts} Closed</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-warmgray-500 text-xs font-semibold">
            <span>{t.shifts.netRevenue}</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.totalRevenue.toFixed(2)} <span className="text-xs font-normal">{currency}</span>
          </p>
          <p className="text-[11px] text-warmgray-400 font-medium mt-1.5">
            Across filtered shifts
          </p>
        </div>

        {/* Net Drawer Discrepancy */}
        <div className="p-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-warmgray-500 text-xs font-semibold">
            <span>{t.shifts.discrepancy}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p
            className={`text-xl sm:text-2xl font-black mt-2 ${
              stats.totalVariance < 0
                ? "text-red-500"
                : stats.totalVariance > 0
                ? "text-emerald-500"
                : "text-warmgray-900 dark:text-white"
            }`}
          >
            {stats.totalVariance >= 0
              ? `+${stats.totalVariance.toFixed(2)}`
              : stats.totalVariance.toFixed(2)}{" "}
            <span className="text-xs font-normal">{currency}</span>
          </p>
          <p className="text-[11px] text-warmgray-400 font-medium mt-1.5">
            {stats.totalVariance < 0
              ? `${t.shifts.short} (drawer loss)`
              : stats.totalVariance > 0
              ? `${t.shifts.over} (excess cash)`
              : "Balanced"}
          </p>
        </div>

        {/* Active Register Cashier */}
        <div className="p-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-warmgray-500 text-xs font-semibold">
            <span>Register Status</span>
            <User className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-base sm:text-lg font-black text-warmgray-900 dark:text-white mt-2 truncate">
            {currentShift ? currentShift.user?.name : "Register Closed"}
          </p>
          <p className="text-[11px] text-warmgray-400 font-medium mt-1.5 truncate">
            {currentShift ? `Role: ${currentShift.user?.role}` : "Click to open register"}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Cashier / ID Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by cashier name or shift ID..."
              className="w-full ps-10 pe-4 py-2 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs text-warmgray-900 dark:text-white placeholder-warmgray-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-warmgray-400 hover:text-warmgray-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="flex-1 md:flex-none px-3 py-2 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold text-warmgray-800 dark:text-warmgray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Active)</option>
              <option value="CLOSED">Closed</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="flex-1 md:flex-none px-3 py-2 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold text-warmgray-800 dark:text-warmgray-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="THIS_MONTH">This Month</option>
            </select>

            {isFiltered && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-warmgray-200 dark:border-warmgray-800 bg-warmgray-50/70 dark:bg-warmgray-800/40 text-warmgray-600 dark:text-warmgray-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 text-start">Shift ID</th>
                <th className="py-3 px-4 text-start">{t.shifts.cashier}</th>
                <th className="py-3 px-4 text-start">Status</th>
                <th className="py-3 px-4 text-start">{t.shifts.openedAt}</th>
                <th className="py-3 px-4 text-start">{t.shifts.closedAt}</th>
                <th className="py-3 px-4 text-end">{t.shifts.startingFloat}</th>
                <th className="py-3 px-4 text-end">{t.shifts.expectedCash}</th>
                <th className="py-3 px-4 text-end">{t.shifts.actualCash}</th>
                <th className="py-3 px-4 text-end">{t.shifts.cashVariance}</th>
                <th className="py-3 px-4 text-end">Sales / Orders</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-warmgray-400 font-medium">
                    Loading shifts records...
                  </td>
                </tr>
              ) : shifts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-warmgray-100 dark:bg-warmgray-800 flex items-center justify-center text-warmgray-400">
                        <Coins className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-warmgray-700 dark:text-warmgray-300">
                        {t.shifts.noShiftsFound}
                      </p>
                      <p className="text-xs text-warmgray-400 max-w-sm">
                        {isFiltered
                          ? "Try changing your filters or search terms."
                          : "No cashier shifts recorded yet. Open a shift to begin recording."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                shifts.map((s) => {
                  const isOpen = s.status === "OPEN";
                  const isOver = (s.cashVariance || 0) > 0;
                  const isShort = (s.cashVariance || 0) < 0;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-warmgray-50/80 dark:hover:bg-warmgray-800/40 transition group"
                    >
                      {/* Shift ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        <Link
                          href={`/shifts/${s.id}`}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          #{s.id.slice(0, 8)}
                        </Link>
                      </td>

                      {/* Cashier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">
                            {s.user?.name ? s.user.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-warmgray-900 dark:text-white truncate max-w-[120px]">
                              {s.user?.name || "Unknown"}
                            </span>
                            <span className="text-[10px] text-warmgray-400 font-semibold uppercase">
                              {s.user?.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isOpen ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t.shifts.activeShift}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-warmgray-100 text-warmgray-700 dark:bg-warmgray-800 dark:text-warmgray-300">
                            {t.shifts.closedShift}
                          </span>
                        )}
                      </td>

                      {/* Opened At */}
                      <td className="py-3.5 px-4 text-warmgray-600 dark:text-warmgray-400 font-mono text-[11px]">
                        <div>{new Date(s.openedAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-warmgray-400">
                          {new Date(s.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Closed At */}
                      <td className="py-3.5 px-4 text-warmgray-600 dark:text-warmgray-400 font-mono text-[11px]">
                        {s.closedAt ? (
                          <>
                            <div>{new Date(s.closedAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-warmgray-400">
                              {new Date(s.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </>
                        ) : (
                          <span className="text-emerald-500 font-bold italic">Active</span>
                        )}
                      </td>

                      {/* Starting Float */}
                      <td className="py-3.5 px-4 text-end font-bold text-warmgray-800 dark:text-warmgray-200">
                        {s.startFloat.toFixed(2)}
                      </td>

                      {/* Expected Cash */}
                      <td className="py-3.5 px-4 text-end font-bold text-warmgray-800 dark:text-warmgray-200">
                        {s.expectedCash != null ? s.expectedCash.toFixed(2) : "-"}
                      </td>

                      {/* Actual Cash */}
                      <td className="py-3.5 px-4 text-end font-bold text-warmgray-900 dark:text-white">
                        {s.actualCash != null ? s.actualCash.toFixed(2) : "-"}
                      </td>

                      {/* Cash Variance */}
                      <td className="py-3.5 px-4 text-end font-bold font-mono">
                        {s.cashVariance != null ? (
                          <span
                            className={
                              isShort
                                ? "text-red-600 dark:text-red-400"
                                : isOver
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-warmgray-700 dark:text-warmgray-300"
                            }
                          >
                            {s.cashVariance >= 0 ? `+${s.cashVariance.toFixed(2)}` : s.cashVariance.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-warmgray-400">-</span>
                        )}
                      </td>

                      {/* Sales / Orders */}
                      <td className="py-3.5 px-4 text-end">
                        <span className="font-bold text-warmgray-900 dark:text-white">
                          {s.totalSales.toFixed(2)} {currency}
                        </span>
                        <div className="text-[10px] text-warmgray-400">
                          {s.totalOrders} {s.totalOrders === 1 ? "order" : "orders"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View details page */}
                          <Link
                            href={`/shifts/${s.id}`}
                            className="p-1.5 rounded-lg text-warmgray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-warmgray-800 transition"
                            title="View Shift Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Print Z-Report */}
                          <button
                            onClick={() => handlePrintReport(s.id)}
                            disabled={loadingReportId === s.id}
                            className="p-1.5 rounded-lg text-warmgray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-warmgray-800 transition disabled:opacity-50"
                            title="Print Z-Report"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={page}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 15, 25, 50]}
        />
      </div>

      {/* Cash Drawer Control Modal */}
      <ShiftControlModal
        isOpen={isControlModalOpen}
        onClose={() => {
          setIsControlModalOpen(false);
          refetch();
          refetchCurrentShift();
        }}
      />

      {/* Printable Z-Report Modal */}
      {selectedZReport && (
        <ZReportModal
          isOpen={isZReportOpen}
          report={selectedZReport}
          onClose={() => {
            setIsZReportOpen(false);
            setSelectedZReport(null);
          }}
        />
      )}
    </div>
  );
}
