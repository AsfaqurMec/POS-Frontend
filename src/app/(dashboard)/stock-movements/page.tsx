"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  Package,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  FileText,
  Eye,
  X,
} from "lucide-react";
import { useStockMovements, useItems, useCategories } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { Pagination } from "@/components/common/Pagination";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/env";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { StockMovement } from "@/types";

export default function StockMovementsPage() {
  const { lang, t } = useLangStore();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [selectedItemId, setSelectedItemId] = useState<string>("ALL");

  // Manual Movement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalItemId, setModalItemId] = useState("");
  const [modalVariantId, setModalVariantId] = useState("");
  const [modalType, setModalType] = useState<"RESTOCK" | "DAMAGE" | "ADJUSTMENT" | "RETURN">("RESTOCK");
  const [modalQuantity, setModalQuantity] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [modalReference, setModalReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute date range
  const dateRange = useMemo(() => {
    const now = new Date();
    if (dateFilter === "TODAY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: new Date().toISOString() };
    }
    if (dateFilter === "7DAYS") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: new Date().toISOString() };
    }
    if (dateFilter === "30DAYS") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: new Date().toISOString() };
    }
    if (dateFilter === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString(), endDate: new Date().toISOString() };
    }
    return { startDate: undefined, endDate: undefined };
  }, [dateFilter]);

  const { data, isLoading, isRefetching, refetch } = useStockMovements({
    page,
    limit: pageSize,
    search: search.trim() || undefined,
    type: typeFilter !== "ALL" ? typeFilter : undefined,
    itemId: selectedItemId !== "ALL" ? selectedItemId : undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: allItems = [] } = useItems("all", undefined, true);

  const movements = data?.movements || [];
  const stats = data?.stats;
  const totalCount = data?.total || 0;

  // Selected item in modal for variant options
  const selectedModalItem = useMemo(() => {
    return allItems.find((i) => i.id === modalItemId);
  }, [allItems, modalItemId]);

  const handleOpenModal = (preselectedItemId?: string) => {
    if (preselectedItemId) {
      setModalItemId(preselectedItemId);
    } else if (allItems.length > 0) {
      setModalItemId(allItems[0].id);
    }
    setModalVariantId("");
    setModalType("RESTOCK");
    setModalQuantity("");
    setModalReason("");
    setModalReference("");
    if (isGuest) return;
    setIsModalOpen(true);
  };

  const handleSubmitManualMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;
    if (!modalItemId) {
      alert("Please select a product");
      return;
    }
    const qty = parseInt(modalQuantity, 10);
    if (isNaN(qty) || qty === 0) {
      alert("Please enter a valid non-zero quantity");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/stock-movements", {
        itemId: modalItemId,
        variantId: modalVariantId || undefined,
        type: modalType,
        quantity: qty,
        reason: modalReason.trim() || undefined,
        referenceId: modalReference.trim() || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      await queryClient.invalidateQueries({ queryKey: ["items"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      setIsModalOpen(false);
    } catch (err: any) {
      alert("Failed to log stock movement: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCSV = () => {
    if (movements.length === 0) {
      alert("No movement records to export");
      return;
    }
    const headers = [
      "Timestamp",
      "Product Name",
      "SKU",
      "Type",
      "Delta Quantity",
      "Previous Stock",
      "New Stock",
      "Reason",
      "Reference",
      "Operator",
    ];

    const rows = movements.map((m) => [
      `"${new Date(m.createdAt).toLocaleString()}"`,
      `"${m.item?.nameEn || ""}"`,
      `"${m.item?.sku || m.variant?.sku || ""}"`,
      `"${m.type}"`,
      m.quantity,
      m.previousStock,
      m.newStock,
      `"${m.reason || ""}"`,
      `"${m.referenceId || ""}"`,
      `"${m.user?.name || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_movements_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-20">
      {/* 1. Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-black text-warmgray-900 dark:text-white tracking-tight">
              Stock Movement Ledger
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-warmgray-600 dark:text-warmgray-400 mt-1 font-medium">
            Complete inventory audit trail: sales deductions, supplier restocks, waste & audit counts
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 text-warmgray-700 dark:text-warmgray-200 hover:bg-warmgray-50 dark:hover:bg-warmgray-800 shadow-sm transition"
            title="Export CSV Report"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {!isGuest && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Movement</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Executive Stock Movement Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-warmgray-500 uppercase tracking-wider">Total Inflow</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            +{isLoading ? "..." : (stats?.totalInflow || 0).toLocaleString()}
            <span className="text-xs font-bold text-warmgray-500 ms-1">units</span>
          </p>
          <p className="text-[11px] text-warmgray-500 mt-1">Restock, returns & inbound</p>
        </div>

        {/* Total Outflow */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-warmgray-500 uppercase tracking-wider">Total Outflow</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">
            -{isLoading ? "..." : (stats?.totalOutflow || 0).toLocaleString()}
            <span className="text-xs font-bold text-warmgray-500 ms-1">units</span>
          </p>
          <p className="text-[11px] text-warmgray-500 mt-1">Sales & damage/waste</p>
        </div>

        {/* Net Change */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-warmgray-500 uppercase tracking-wider">Net Delta</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-2xl font-black mt-2 ${
              (stats?.netChange || 0) >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {(stats?.netChange || 0) > 0 ? `+${stats?.netChange}` : stats?.netChange || 0}
            <span className="text-xs font-bold text-warmgray-500 ms-1">units</span>
          </p>
          <p className="text-[11px] text-warmgray-500 mt-1">Period net inventory shift</p>
        </div>

        {/* Movement Operations Count */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-warmgray-500 uppercase tracking-wider">Ledger Events</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-warmgray-900 dark:text-white mt-2">
            {isLoading ? "..." : (stats?.totalMovements || 0).toLocaleString()}
            <span className="text-xs font-bold text-warmgray-500 ms-1">events</span>
          </p>
          <p className="text-[11px] text-warmgray-500 mt-1">
            {stats?.todayCount || 0} events today
          </p>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search product, SKU, invoice #, reason, or cashier..."
              className="w-full ps-10 pe-4 py-2 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 shadow-sm"
            />
          </div>

          {/* Quick Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {["ALL", "SALE", "RESTOCK", "DAMAGE", "ADJUSTMENT", "RETURN"].map((tType) => (
              <button
                key={tType}
                onClick={() => {
                  setTypeFilter(tType);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  typeFilter === tType
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-200 dark:hover:bg-warmgray-700"
                }`}
              >
                {tType === "ALL" ? "All Types" : tType}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters Row: Product Select & Date Range */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-warmgray-100 dark:border-warmgray-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-warmgray-500">Product:</span>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-lg font-bold text-warmgray-700 dark:text-warmgray-200 focus:ring-1 focus:ring-amber-500 max-w-[200px]"
            >
              <option value="ALL">All Products</option>
              {allItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-warmgray-500">Date Range:</span>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-lg font-bold text-warmgray-700 dark:text-warmgray-200 focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="7DAYS">Last 7 Days</option>
              <option value="30DAYS">Last 30 Days</option>
              <option value="THIS_MONTH">This Month</option>
            </select>
          </div>

          {(search || typeFilter !== "ALL" || dateFilter !== "ALL" || selectedItemId !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setTypeFilter("ALL");
                setDateFilter("ALL");
                setSelectedItemId("ALL");
                setPage(1);
              }}
              className="ms-auto font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. High-Density ERP Audit Ledger Table */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-warmgray-50 dark:bg-warmgray-950/80 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 text-start">Timestamp</th>
                <th className="py-3.5 px-4 text-start">Product Details</th>
                <th className="py-3.5 px-4 text-start">Event Type</th>
                <th className="py-3.5 px-4 text-start">Quantity Delta</th>
                <th className="py-3.5 px-4 text-start">Stock Transition</th>
                <th className="py-3.5 px-4 text-start">Reference / Reason</th>
                <th className="py-3.5 px-4 text-start">Logged By</th>
                <th className="py-3.5 px-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800/80">
              {movements.map((m) => {
                const isPositive = m.quantity > 0;
                const prodName = lang === "ar" ? m.item?.nameAr : m.item?.nameEn;
                const prodSub = lang === "ar" ? m.item?.nameEn : m.item?.nameAr;

                // Format variant string if present
                const variantDesc = m.variant?.variantOptions
                  ?.map((vo) => (lang === "ar" ? vo.variationOption.nameAr : vo.variationOption.nameEn))
                  .join(" / ");

                return (
                  <tr key={m.id} className="hover:bg-warmgray-50/70 dark:hover:bg-warmgray-800/40 transition">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-warmgray-900 dark:text-white">
                        {new Date(m.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-[10px] text-warmgray-500 font-mono">
                        {new Date(m.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-warmgray-100 dark:bg-warmgray-800 flex items-center justify-center overflow-hidden border border-warmgray-200 dark:border-warmgray-700 shrink-0">
                          {m.item?.imageUrl ? (
                            <img
                              src={getMediaUrl(m.item.imageUrl)}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Coffee className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/products/${m.itemId}`}
                            className="font-bold text-warmgray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition"
                          >
                            {prodName || "Item"}
                          </Link>
                          {variantDesc && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">{variantDesc}</p>
                          )}
                          <p className="text-[10px] text-warmgray-500 font-mono">
                            SKU: {m.variant?.sku || m.item?.sku || "—"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Event Type Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          m.type === "SALE"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : m.type === "RESTOCK"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : m.type === "DAMAGE"
                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : m.type === "RETURN"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {m.type === "SALE" && <ArrowUpRight className="w-3 h-3" />}
                        {m.type === "RESTOCK" && <ArrowDownLeft className="w-3 h-3" />}
                        {m.type === "DAMAGE" && <XCircle className="w-3 h-3" />}
                        {m.type === "RETURN" && <ArrowDownLeft className="w-3 h-3" />}
                        {m.type === "ADJUSTMENT" && <ArrowLeftRight className="w-3 h-3" />}
                        <span>{m.type}</span>
                      </span>
                    </td>

                    {/* Quantity Delta */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-black text-sm ${
                          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isPositive ? `+${m.quantity}` : m.quantity} units
                      </span>
                    </td>

                    {/* Stock Transition */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-warmgray-500">{m.previousStock}</span>
                        <span className="text-warmgray-400">→</span>
                        <span className="font-bold text-warmgray-900 dark:text-white bg-warmgray-100 dark:bg-warmgray-800 px-2 py-0.5 rounded-lg">
                          {m.newStock}
                        </span>
                      </div>
                    </td>

                    {/* Reference / Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {m.referenceId ? (
                        <p className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          {m.referenceId}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-warmgray-600 dark:text-warmgray-300 truncate">
                        {m.reason || "Manual inventory adjustment"}
                      </p>
                    </td>

                    {/* Logged By */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="font-bold text-warmgray-900 dark:text-white">
                        {m.user?.name || "System"}
                      </p>
                      <p className="text-[10px] text-warmgray-500 font-semibold">{m.user?.role || "SYSTEM"}</p>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-end">
                      <Link
                        href={`/products/${m.itemId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-warmgray-100 hover:bg-warmgray-200 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Product</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {movements.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-warmgray-400">
                    <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-sm text-warmgray-800 dark:text-warmgray-200">
                      No stock movement events found
                    </p>
                    <p className="text-xs text-warmgray-500 mt-1">
                      Stock movement records are created automatically when sales occur or when restocks are logged
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <Pagination
            currentPage={page}
            totalItems={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[10, 15, 25, 50]}
          />
        )}
      </div>

      {/* 5. Manual Movement Logging Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-warmgray-100 dark:border-warmgray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-warmgray-900 dark:text-white">
                    Record Stock Movement
                  </h3>
                  <p className="text-[11px] text-warmgray-500 font-medium">
                    Log supplier restock, waste/spoilage, or audit reconciliation
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-warmgray-400 hover:text-warmgray-900 dark:hover:text-white hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitManualMovement} className="p-5 space-y-4">
              {/* Product Select */}
              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5">
                  Select Product *
                </label>
                <select
                  value={modalItemId}
                  onChange={(e) => {
                    setModalItemId(e.target.value);
                    setModalVariantId("");
                  }}
                  className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold text-warmgray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                >
                  {allItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameEn} ({item.stockQuantity} in stock)
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant Select (if item has variants) */}
              {selectedModalItem && selectedModalItem.variants && selectedModalItem.variants.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5">
                    Select Variant Matrix Option
                  </label>
                  <select
                    value={modalVariantId}
                    onChange={(e) => setModalVariantId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold text-warmgray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Base Product Stock</option>
                    {selectedModalItem.variants.map((v) => {
                      const desc = v.variantOptions
                        ?.map((vo) => vo.variationOption.nameEn)
                        .join(" / ");
                      return (
                        <option key={v.id} value={v.id}>
                          {desc || v.sku || "Variant"} ({v.stockQuantity} in stock)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Movement Type */}
              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5">
                  Movement Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType("RESTOCK")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      modalType === "RESTOCK"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                        : "border-warmgray-200 dark:border-warmgray-700 text-warmgray-600 dark:text-warmgray-400"
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                    <span>Restock / Inbound (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType("DAMAGE")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      modalType === "DAMAGE"
                        ? "border-red-500 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                        : "border-warmgray-200 dark:border-warmgray-700 text-warmgray-600 dark:text-warmgray-400"
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Damage / Spoilage (-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType("ADJUSTMENT")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      modalType === "ADJUSTMENT"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                        : "border-warmgray-200 dark:border-warmgray-700 text-warmgray-600 dark:text-warmgray-400"
                    }`}
                  >
                    <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                    <span>Audit Adjustment (+/-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType("RETURN")}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      modalType === "RETURN"
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300"
                        : "border-warmgray-200 dark:border-warmgray-700 text-warmgray-600 dark:text-warmgray-400"
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-purple-500" />
                    <span>Customer Return (+)</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={modalQuantity}
                  onChange={(e) => setModalQuantity(e.target.value)}
                  placeholder={modalType === "DAMAGE" ? "e.g. 5 (will be subtracted)" : "e.g. 25"}
                  className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold text-warmgray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5">
                  Reason / Explanation
                </label>
                <input
                  type="text"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="e.g. Supplier delivery batch #48, or Spilled bean hopper"
                  className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-warmgray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Reference ID (Optional) */}
              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5">
                  Reference Code (PO # / Audit Code)
                </label>
                <input
                  type="text"
                  value={modalReference}
                  onChange={(e) => setModalReference(e.target.value)}
                  placeholder="e.g. PO-9821, AUDIT-2026-Q1"
                  className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-mono font-medium text-warmgray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-warmgray-100 dark:border-warmgray-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/30 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Logging..." : "Commit Movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
