"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useInventory, useCategories } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/env";
import { useAuthStore } from "@/store/authStore";
import {
  Boxes,
  Search,
  Edit3,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  ArrowUpDown,
  Filter,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Coffee,
  Eye,
  ArrowLeftRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { InventoryItem } from "@/types";
import { Pagination } from "@/components/common/Pagination";

export default function InventoryPage() {
  const { lang, t } = useLangStore();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW" | "OUT_OF_STOCK">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "stock_asc" | "stock_desc" | "valuation_desc">("stock_asc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data: inventory = [], isLoading } = useInventory(searchTerm);
  const { data: categories = [] } = useCategories();

  // Stock Adjustment Modal State
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [newStock, setNewStock] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState<"RESTOCK" | "WASTE" | "AUDIT">("RESTOCK");
  const [isUpdating, setIsUpdating] = useState(false);
  const [quickAdjustingId, setQuickAdjustingId] = useState<string | null>(null);

  // Compute Overall Inventory Stats
  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalUnits = inventory.reduce((sum, item) => sum + item.stockQuantity, 0);
    const totalValuation = inventory.reduce((sum, item) => sum + item.valuation, 0);
    const lowStockCount = inventory.filter((item) => item.status === "LOW").length;
    const outOfStockCount = inventory.filter((item) => item.status === "OUT_OF_STOCK").length;
    const inStockCount = inventory.filter((item) => item.status === "IN_STOCK").length;

    return {
      totalItems,
      totalUnits,
      totalValuation,
      lowStockCount,
      outOfStockCount,
      inStockCount,
    };
  }, [inventory]);

  // Filtered & Sorted items
  const filteredInventory = useMemo(() => {
    return inventory
      .filter((item) => {
        // Status Filter
        if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

        // Category Filter
        if (categoryFilter !== "ALL" && item.categoryId !== categoryFilter) return false;

        // Type Filter
        if (typeFilter !== "ALL" && item.type !== typeFilter) return false;

        // Search Term (additional client-side safeguard)
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchName =
            item.nameEn.toLowerCase().includes(q) ||
            item.nameAr.toLowerCase().includes(q) ||
            item.sku.toLowerCase().includes(q) ||
            item.barcode.toLowerCase().includes(q);
          if (!matchName) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "stock_asc") return a.stockQuantity - b.stockQuantity;
        if (sortBy === "stock_desc") return b.stockQuantity - a.stockQuantity;
        if (sortBy === "valuation_desc") return b.valuation - a.valuation;
        return a.nameEn.localeCompare(b.nameEn);
      });
  }, [inventory, statusFilter, categoryFilter, typeFilter, searchTerm, sortBy]);

  // Reset page when any filter or search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, categoryFilter, typeFilter, sortBy]);

  const paginatedInventory = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredInventory.slice(start, start + pageSize);
  }, [filteredInventory, page, pageSize]);

  // Inline Quick Delta Adjustment (+1, +5, +10, -1)
  const handleQuickDelta = async (item: InventoryItem, delta: number) => {
    if (isGuest || item.stockQuantity + delta < 0) return;
    setQuickAdjustingId(item.id);
    try {
      await api.patch(`/inventory/${item.id}`, {
        type: item.type,
        delta,
      });
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
    } catch (err: any) {
      alert("Failed to adjust stock: " + err.message);
    } finally {
      setQuickAdjustingId(null);
    }
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    if (isGuest) return;
    setAdjustItem(item);
    setNewStock(item.stockQuantity.toString());
    setAdjustmentReason("RESTOCK");
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || isGuest) return;

    const parsedQty = parseInt(newStock, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      alert("Please enter a valid stock quantity");
      return;
    }

    setIsUpdating(true);
    try {
      await api.patch(`/inventory/${adjustItem.id}`, {
        type: adjustItem.type,
        quantity: parsedQty,
      });

      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setAdjustItem(null);
    } catch (err: any) {
      alert("Failed to update stock: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-warmgray-900 dark:text-white tracking-tight">
            {t.inventory.title}
          </h1>
          <p className="text-xs sm:text-sm text-warmgray-600 dark:text-warmgray-400 mt-1 font-medium">
            Real-time stock monitoring, inventory valuation, and restock management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/stock-movements"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Stock Ledger</span>
          </Link>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["inventory"] })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 text-warmgray-700 dark:text-warmgray-300 font-bold text-xs hover:bg-warmgray-50 dark:hover:bg-warmgray-800 transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 5 Executive Inventory KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Tracked Items */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-600 dark:text-warmgray-300 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-400">Tracked SKUs</p>
            <p className="text-xl font-black text-warmgray-900 dark:text-white mt-0.5">
              {stats.totalItems}
            </p>
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-400">Total Units</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {stats.totalUnits.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-400">Valuation</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.totalValuation.toFixed(0)}{" "}
              <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-bold">SAR</span>
            </p>
          </div>
        </div>

        {/* Low Stock Warnings */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-400">Low Stock (≤5)</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {stats.lowStockCount}
            </p>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-4 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-400">Out of Stock</p>
            <p className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">
              {stats.outOfStockCount}
            </p>
          </div>
        </div>
      </div>

      {/* Main Inventory Card */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Filter and Search Bar */}
        <div className="p-4 sm:p-5 border-b border-warmgray-100 dark:border-warmgray-800 flex flex-col space-y-4">
          {/* Top Row: Search and Status Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by item name, SKU, barcode..."
                className="w-full ps-10 pe-4 py-2.5 bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Stock Status Filter Tabs */}
            <div className="flex items-center bg-warmgray-100 dark:bg-warmgray-800 p-1 rounded-2xl text-xs overflow-x-auto">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  statusFilter === "ALL"
                    ? "bg-white dark:bg-warmgray-900 text-amber-600 shadow-sm"
                    : "text-warmgray-500 hover:text-warmgray-900 dark:hover:text-white"
                }`}
              >
                <span>All Items</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-warmgray-200 dark:bg-warmgray-700 rounded-full font-bold">
                  {stats.totalItems}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("IN_STOCK")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  statusFilter === "IN_STOCK"
                    ? "bg-white dark:bg-warmgray-900 text-emerald-600 shadow-sm"
                    : "text-warmgray-500 hover:text-warmgray-900 dark:hover:text-white"
                }`}
              >
                <span>In Stock</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full font-bold">
                  {stats.inStockCount}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("LOW")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  statusFilter === "LOW"
                    ? "bg-white dark:bg-warmgray-900 text-amber-600 shadow-sm"
                    : "text-warmgray-500 hover:text-warmgray-900 dark:hover:text-white"
                }`}
              >
                <span>Low Stock</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full font-bold">
                  {stats.lowStockCount}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter("OUT_OF_STOCK")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  statusFilter === "OUT_OF_STOCK"
                    ? "bg-white dark:bg-warmgray-900 text-red-600 shadow-sm"
                    : "text-warmgray-500 hover:text-warmgray-900 dark:hover:text-white"
                }`}
              >
                <span>Out of Stock</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-full font-bold">
                  {stats.outOfStockCount}
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Category, Type and Sort Dropdowns */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-warmgray-100 dark:border-warmgray-800/80">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-warmgray-700 dark:text-warmgray-400 font-bold">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl px-2.5 py-1.5 font-bold text-xs text-warmgray-800 dark:text-warmgray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === "ar" ? c.nameAr : c.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-warmgray-700 dark:text-warmgray-400 font-bold">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl px-2.5 py-1.5 font-bold text-xs text-warmgray-800 dark:text-warmgray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="ITEM">Standard Item</option>
                  <option value="VARIANT">Variant Matrix</option>
                </select>
              </div>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-warmgray-500 dark:text-warmgray-400" />
              <span className="text-warmgray-700 dark:text-warmgray-300 font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl px-2.5 py-1.5 font-bold text-xs text-warmgray-800 dark:text-warmgray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="stock_asc">Stock: Low to High</option>
                <option value="stock_desc">Stock: High to Low</option>
                <option value="valuation_desc">Valuation: High to Low</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-warmgray-50 dark:bg-warmgray-950/80 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800 sticky top-0 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-5 text-start">Product Item</th>
                <th className="py-3.5 px-4 text-start">Category</th>
                <th className="py-3.5 px-4 text-start">SKU / Barcode</th>
                <th className="py-3.5 px-4 text-start">Unit Price</th>
                <th className="py-3.5 px-4 text-start">Current Stock</th>
                <th className="py-3.5 px-4 text-start">Status</th>
                <th className="py-3.5 px-4 text-start">Asset Value</th>
                <th className="py-3.5 px-5 text-end">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800/80">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-5 px-5">
                      <div className="h-6 bg-warmgray-100 dark:bg-warmgray-800 rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : filteredInventory.length > 0 ? (
                paginatedInventory.map((row) => {
                  const isOutOfStock = row.status === "OUT_OF_STOCK";
                  const isLow = row.status === "LOW";
                  const isBusy = quickAdjustingId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-warmgray-50/70 dark:hover:bg-warmgray-800/40 transition group"
                    >
                      {/* Item Thumbnail & Name */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-2xl bg-warmgray-100 dark:bg-warmgray-800 overflow-hidden border border-warmgray-200 dark:border-warmgray-700 shrink-0">
                            {row.imageUrl ? (
                              <img
                                src={getMediaUrl(row.imageUrl)}
                                alt={row.nameEn}
                                className={`w-full h-full object-cover ${
                                  isOutOfStock ? "grayscale contrast-50 opacity-60" : ""
                                }`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-warmgray-400">
                                <Coffee className="w-5 h-5" />
                              </div>
                            )}

                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-red-950/40 backdrop-blur-[1px] flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-sm text-warmgray-900 dark:text-white leading-tight">
                                {lang === "ar" ? row.nameAr : row.nameEn}
                              </p>
                              {row.type === "VARIANT" && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                  VARIANT
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium mt-0.5">
                              {lang === "ar" ? row.nameEn : row.nameAr}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-warmgray-700 dark:text-warmgray-300 font-semibold">
                        {lang === "ar" ? row.categoryAr : row.categoryEn}
                      </td>

                      {/* SKU / Barcode */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-warmgray-700 dark:text-warmgray-300 font-medium">
                        <div>{row.sku}</div>
                        {row.barcode !== "-" && (
                          <div className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-mono font-medium">{row.barcode}</div>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4 font-bold text-warmgray-800 dark:text-warmgray-200">
                        {row.basePrice.toFixed(2)}{" "}
                        <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-bold">SAR</span>
                      </td>

                      {/* Current Stock with Progress Visual */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-base font-black ${
                                isOutOfStock
                                  ? "text-red-600 dark:text-red-400"
                                  : isLow
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-warmgray-900 dark:text-white"
                              }`}
                            >
                              {row.stockQuantity}
                            </span>
                            <span className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-bold">units</span>
                          </div>
                          {/* Stock Health Bar */}
                          <div className="w-24 h-1.5 bg-warmgray-100 dark:bg-warmgray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOutOfStock
                                  ? "w-0"
                                  : isLow
                                  ? "w-1/3 bg-amber-500"
                                  : "w-full bg-emerald-500"
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/70 px-2.5 py-1 rounded-xl">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Out of Stock</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-2.5 py-1 rounded-xl">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-1 rounded-xl">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Asset Valuation */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-sm text-warmgray-900 dark:text-white">
                          {row.valuation.toFixed(2)}{" "}
                          <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-bold">SAR</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Delta Buttons & Adjust */}
                          {!isGuest ? (
                            <>
                              <div className="flex items-center bg-warmgray-100 dark:bg-warmgray-800 rounded-xl p-0.5">
                                <button
                                  disabled={isBusy || row.stockQuantity <= 0}
                                  onClick={() => handleQuickDelta(row, -1)}
                                  className="p-1 rounded-lg text-warmgray-600 hover:text-red-600 hover:bg-white dark:hover:bg-warmgray-700 transition disabled:opacity-30"
                                  title="Decrease 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleQuickDelta(row, +1)}
                                  className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-warmgray-700 dark:text-warmgray-300 hover:text-amber-600 hover:bg-white dark:hover:bg-warmgray-700 transition disabled:opacity-30"
                                  title="Quick Add 1"
                                >
                                  +1
                                </button>
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleQuickDelta(row, +5)}
                                  className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-warmgray-700 dark:text-warmgray-300 hover:text-amber-600 hover:bg-white dark:hover:bg-warmgray-700 transition disabled:opacity-30"
                                  title="Quick Restock +5"
                                >
                                  +5
                                </button>
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleQuickDelta(row, +10)}
                                  className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:bg-white dark:hover:bg-warmgray-700 transition disabled:opacity-30"
                                  title="Bulk Restock +10"
                                >
                                  +10
                                </button>
                              </div>

                              {/* Detailed Adjust Modal Button */}
                              <button
                                onClick={() => handleOpenAdjust(row)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 transition"
                                title="Set exact stock quantity"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Adjust</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-600/80 px-2 py-0.5 bg-amber-500/10 rounded-lg">
                              View Only
                            </span>
                          )}

                          {/* Link to Product Details & Movements */}
                          <Link
                            href={`/products/${row.itemId}`}
                            className="p-1.5 rounded-xl text-warmgray-500 hover:text-amber-600 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
                            title="View Product History & Movements"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-warmgray-400">
                    <Boxes className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm text-warmgray-700 dark:text-warmgray-300">
                      No stock items found
                    </p>
                    <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-1">
                      Try clearing filters or search terms to inspect all inventory items
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredInventory.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={filteredInventory.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[10, 15, 25, 50]}
          />
        )}

        {/* Bottom Status Bar */}
        <div className="p-3.5 px-5 bg-warmgray-50 dark:bg-warmgray-950/60 border-t border-warmgray-100 dark:border-warmgray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium text-warmgray-700 dark:text-warmgray-300">
          <div>
            Showing <span className="font-bold text-warmgray-900 dark:text-white">{filteredInventory.length}</span> of{" "}
            <span className="font-bold text-warmgray-900 dark:text-white">{stats.totalItems}</span> tracked items
          </div>
          <div className="flex items-center gap-4">
            <span>
              Filtered Units:{" "}
              <strong className="text-warmgray-900 dark:text-white">
                {filteredInventory.reduce((s, i) => s + i.stockQuantity, 0).toLocaleString()}
              </strong>
            </span>
            <span>
              Filtered Value:{" "}
              <strong className="text-amber-600 dark:text-amber-400">
                {filteredInventory.reduce((s, i) => s + i.valuation, 0).toFixed(2)} SAR
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Adjust Stock Dialog */}
      {adjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-warmgray-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-warmgray-200 dark:border-warmgray-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-warmgray-100 dark:border-warmgray-800">
              <div>
                <h3 className="font-black text-sm text-warmgray-900 dark:text-white">
                  {t.inventory.updateStock}
                </h3>
                <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium">
                  Update inventory counts for store shelf and backroom
                </p>
              </div>
              <button
                onClick={() => setAdjustItem(null)}
                className="p-1 text-warmgray-500 hover:text-warmgray-800 dark:text-warmgray-400 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-warmgray-50 dark:bg-warmgray-800/60 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warmgray-200 dark:bg-warmgray-700 overflow-hidden shrink-0">
                {adjustItem.imageUrl ? (
                  <img
                    src={getMediaUrl(adjustItem.imageUrl)}
                    alt={adjustItem.nameEn}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-warmgray-400">
                    <Coffee className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-warmgray-900 dark:text-white truncate">
                  {adjustItem.nameEn}
                </p>
                <p className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-mono font-medium">
                  Current: {adjustItem.stockQuantity} units • {adjustItem.sku}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                  Adjustment Reason
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdjustmentReason("RESTOCK")}
                    className={`py-1.5 rounded-xl text-[11px] font-bold border transition ${
                      adjustmentReason === "RESTOCK"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-warmgray-50 dark:bg-warmgray-800 border-warmgray-200 dark:border-warmgray-700 text-warmgray-600 dark:text-warmgray-300"
                    }`}
                  >
                    Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentReason("AUDIT")}
                    className={`py-1.5 rounded-xl text-[11px] font-bold border transition ${
                      adjustmentReason === "AUDIT"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-warmgray-50 dark:bg-warmgray-800 border-warmgray-200 dark:border-warmgray-700 text-warmgray-600 dark:text-warmgray-300"
                    }`}
                  >
                    Audit Count
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentReason("WASTE")}
                    className={`py-1.5 rounded-xl text-[11px] font-bold border transition ${
                      adjustmentReason === "WASTE"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-warmgray-50 dark:bg-warmgray-800 border-warmgray-200 dark:border-warmgray-700 text-warmgray-600 dark:text-warmgray-300"
                    }`}
                  >
                    Waste/Spill
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                  {t.inventory.newStock} (Units)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-base font-black text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-warmgray-100 hover:bg-warmgray-200 text-warmgray-700 dark:bg-warmgray-800 dark:text-warmgray-300 transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/30 transition disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}