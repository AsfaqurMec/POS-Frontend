"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Coffee,
  Package,
  Layers,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ArrowLeftRight,
  Barcode,
  Edit2,
  Calendar,
  Receipt,
  User,
  X,
} from "lucide-react";
import { useProductStats, useStockMovements } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/env";
import { useQueryClient } from "@tanstack/react-query";
import { Pagination } from "@/components/common/Pagination";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { lang, t } = useLangStore();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"movements" | "variants" | "sales">("movements");
  const [movementTypeFilter, setMovementTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Manual stock movement modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [modalType, setModalType] = useState<"RESTOCK" | "DAMAGE" | "ADJUSTMENT" | "RETURN">("RESTOCK");
  const [modalQuantity, setModalQuantity] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch product stats & details
  const { data, isLoading } = useProductStats(id);

  // Fetch paginated movements for this item
  const { data: movementsData } = useStockMovements({
    itemId: id,
    page,
    limit: pageSize,
    type: movementTypeFilter !== "ALL" ? movementTypeFilter : undefined,
  });

  const item = data?.item;
  const stats = data?.stats;
  const recentSales = data?.recentSales || [];
  const movements = movementsData?.movements || [];
  const totalMovements = movementsData?.total || 0;

  const prodName = lang === "ar" ? item?.nameAr : item?.nameEn;
  const prodSub = lang === "ar" ? item?.nameEn : item?.nameAr;

  const formatCurrency = (val: number = 0) => `${val.toFixed(2)} SAR`;

  const handleOpenRestock = (variantId?: string) => {
    setSelectedVariantId(variantId || "");
    setModalType("RESTOCK");
    setModalQuantity("");
    setModalReason("");
    setIsModalOpen(true);
  };

  const handleSubmitMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(modalQuantity, 10);
    if (isNaN(qty) || qty === 0) {
      alert("Please enter a valid non-zero quantity");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/stock-movements", {
        itemId: id,
        variantId: selectedVariantId || undefined,
        type: modalType,
        quantity: qty,
        reason: modalReason.trim() || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ["product-stats", id] });
      await queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory"] });
      await queryClient.invalidateQueries({ queryKey: ["items"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      setIsModalOpen(false);
    } catch (err: any) {
      alert("Failed to record movement: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-warmgray-500">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-warmgray-900 dark:text-white">Product Not Found</h2>
        <p className="text-xs text-warmgray-500">The product requested could not be located in the catalog.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  const isOutOfStock = item.stockEnabled && item.stockQuantity <= 0;
  const isLowStock = item.stockEnabled && item.stockQuantity > 0 && item.stockQuantity <= 5;

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-20">
      {/* 1. Breadcrumb & Back Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-warmgray-600 dark:text-warmgray-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products Catalog</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isGuest && (
            <button
              onClick={() => handleOpenRestock()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Movement</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Hero Product Information Card */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Product Thumbnail / Image */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-warmgray-100 dark:bg-warmgray-800 overflow-hidden border border-warmgray-200 dark:border-warmgray-700 shrink-0">
            {item.imageUrl ? (
              <img
                src={getMediaUrl(item.imageUrl)}
                alt={prodName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-warmgray-400">
                <Coffee className="w-12 h-12" />
              </div>
            )}
            <span
              className={`absolute top-2.5 start-2.5 px-2 py-0.5 rounded-md text-[10px] font-black ${
                item.active ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              {item.active ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          {/* Product Metadata */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {item.category && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300">
                  {lang === "ar" ? item.category.nameAr : item.category.nameEn}
                </span>
              )}
              {item.variationMode === "VARIANT" && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>Matrix Variant Mode ({item.variants?.length || 0} combos)</span>
                </span>
              )}
              {item.variationMode === "OPTION" && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Customizable Options Group</span>
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-warmgray-900 dark:text-white tracking-tight">
                {prodName}
              </h1>
              {prodSub && <p className="text-sm font-medium text-warmgray-500 mt-0.5">{prodSub}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-warmgray-600 dark:text-warmgray-400">
              {item.sku && (
                <div className="flex items-center gap-1">
                  <span className="font-bold text-warmgray-500">SKU:</span>
                  <span className="font-mono font-bold text-warmgray-900 dark:text-white">{item.sku}</span>
                </div>
              )}
              {item.barcode && (
                <div className="flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5" />
                  <span className="font-mono text-warmgray-900 dark:text-white">{item.barcode}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="font-bold text-warmgray-500">Base Price:</span>
                <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                  {formatCurrency(item.basePrice)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ERP Performance Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Current Stock */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-warmgray-500 uppercase tracking-wider">Current Stock</span>
          <p
            className={`text-2xl font-black mt-1 ${
              isOutOfStock
                ? "text-red-600 dark:text-red-400"
                : isLowStock
                ? "text-amber-600 dark:text-amber-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {item.stockQuantity}
            <span className="text-xs font-bold text-warmgray-500 ms-1">units</span>
          </p>
          <span className="text-[10px] font-bold text-warmgray-400">
            {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock Warning" : "In Stock"}
          </span>
        </div>

        {/* Units Sold */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-warmgray-500 uppercase tracking-wider">Total Sold</span>
          <p className="text-2xl font-black text-warmgray-900 dark:text-white mt-1">
            {(stats?.totalSoldUnits || 0).toLocaleString()}
            <span className="text-xs font-bold text-warmgray-500 ms-1">units</span>
          </p>
          <span className="text-[10px] font-bold text-warmgray-400">{stats?.salesCount || 0} order lines</span>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-warmgray-500 uppercase tracking-wider">Total Revenue</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {(stats?.totalRevenue || 0).toLocaleString()}
            <span className="text-xs font-bold text-warmgray-500 ms-1">SAR</span>
          </p>
          <span className="text-[10px] font-bold text-warmgray-400">Gross sales</span>
        </div>

        {/* Total Restocked */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-warmgray-500 uppercase tracking-wider">Total Inflow</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            +{(stats?.totalRestocked || 0).toLocaleString()}
            <span className="text-xs font-bold text-warmgray-500 ms-1">units</span>
          </p>
          <span className="text-[10px] font-bold text-warmgray-400">Purchases & restocks</span>
        </div>

        {/* Total Damaged / Loss */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-warmgray-500 uppercase tracking-wider">Total Waste/Loss</span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            -{(stats?.totalDamaged || 0).toLocaleString()}
            <span className="text-xs font-bold text-warmgray-500 ms-1">units</span>
          </p>
          <span className="text-[10px] font-bold text-warmgray-400">Damage / expired</span>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-warmgray-500 uppercase tracking-wider">Stock Value</span>
          <p className="text-2xl font-black text-warmgray-900 dark:text-white mt-1">
            {(stats?.currentValuation || 0).toLocaleString()}
            <span className="text-xs font-bold text-warmgray-500 ms-1">SAR</span>
          </p>
          <span className="text-[10px] font-bold text-warmgray-400">Current asset value</span>
        </div>
      </div>

      {/* 4. Tab Switcher (Stock Movements Ledger vs Matrix Variants vs Sales History) */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("movements")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === "movements"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-200"
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Stock Movements Ledger ({totalMovements})</span>
          </button>

          {item.variationMode === "VARIANT" && (
            <button
              onClick={() => setActiveTab("variants")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === "variants"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-200"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Variant Breakdown ({item.variants?.length || 0})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeTab === "sales"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-200"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Recent Sales Lines ({recentSales.length})</span>
          </button>
        </div>

        {activeTab === "movements" && (
          <div className="flex items-center gap-1.5">
            {["ALL", "SALE", "RESTOCK", "DAMAGE", "ADJUSTMENT"].map((tType) => (
              <button
                key={tType}
                onClick={() => {
                  setMovementTypeFilter(tType);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  movementTypeFilter === tType
                    ? "bg-warmgray-900 text-white dark:bg-white dark:text-warmgray-900"
                    : "text-warmgray-500 hover:text-warmgray-900 dark:hover:text-white"
                }`}
              >
                {tType}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. TAB 1: Stock Movements Table */}
      {activeTab === "movements" && (
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-warmgray-50 dark:bg-warmgray-950/80 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 text-start">Timestamp</th>
                  <th className="py-3 px-4 text-start">Variant Target</th>
                  <th className="py-3 px-4 text-start">Movement Type</th>
                  <th className="py-3 px-4 text-start">Delta Qty</th>
                  <th className="py-3 px-4 text-start">Stock Level (Before → After)</th>
                  <th className="py-3 px-4 text-start">Reference / Reason</th>
                  <th className="py-3 px-4 text-start">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800/80">
                {movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  const variantDesc = m.variant?.variantOptions
                    ?.map((vo) => (lang === "ar" ? vo.variationOption.nameAr : vo.variationOption.nameEn))
                    .join(" / ");

                  return (
                    <tr key={m.id} className="hover:bg-warmgray-50/70 dark:hover:bg-warmgray-800/40 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-warmgray-900 dark:text-white">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-warmgray-500 font-mono">
                          {new Date(m.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-warmgray-800 dark:text-warmgray-200">
                          {variantDesc || "Base Product Stock"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black ${
                            m.type === "SALE"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : m.type === "RESTOCK"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : m.type === "DAMAGE"
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`font-black text-sm ${
                            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isPositive ? `+${m.quantity}` : m.quantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-warmgray-500">{m.previousStock}</span>
                        <span className="mx-2 text-warmgray-400">→</span>
                        <span className="font-bold text-warmgray-900 dark:text-white bg-warmgray-100 dark:bg-warmgray-800 px-2 py-0.5 rounded-lg">
                          {m.newStock} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {m.referenceId && (
                          <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400 block">
                            {m.referenceId}
                          </span>
                        )}
                        <span className="text-[11px] text-warmgray-600 dark:text-warmgray-300">
                          {m.reason || "Manual adjustment"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-warmgray-900 dark:text-white">{m.user?.name || "System"}</p>
                        <p className="text-[10px] text-warmgray-500">{m.user?.role || "STAFF"}</p>
                      </td>
                    </tr>
                  );
                })}

                {movements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-warmgray-400">
                      No stock movement history recorded for this product yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalMovements > 0 && (
            <Pagination
              currentPage={page}
              totalItems={totalMovements}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      {/* 6. TAB 2: Matrix Variants Breakdown */}
      {activeTab === "variants" && (
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-warmgray-50 dark:bg-warmgray-950/80 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 text-start">Variant Combination</th>
                  <th className="py-3 px-4 text-start">SKU</th>
                  <th className="py-3 px-4 text-start">Barcode</th>
                  <th className="py-3 px-4 text-start">Price</th>
                  <th className="py-3 px-4 text-start">Stock Level</th>
                  <th className="py-3 px-4 text-start">Status</th>
                  <th className="py-3 px-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800/80">
                {(item.variants || []).map((v) => {
                  const combo = v.variantOptions
                    ?.map((vo) => (lang === "ar" ? vo.variationOption.nameAr : vo.variationOption.nameEn))
                    .join(" / ");
                  const isVarOut = v.stockQuantity <= 0;
                  const isVarLow = v.stockQuantity > 0 && v.stockQuantity <= 5;

                  return (
                    <tr key={v.id} className="hover:bg-warmgray-50/70 dark:hover:bg-warmgray-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-warmgray-900 dark:text-white">
                        {combo || "Variant"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-warmgray-600 dark:text-warmgray-300">
                        {v.sku || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-warmgray-600 dark:text-warmgray-300">
                        {v.barcode || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-black text-amber-600 dark:text-amber-400">
                        {formatCurrency(v.price)}
                      </td>
                      <td className="py-3.5 px-4 font-black text-sm">
                        <span
                          className={`${
                            isVarOut
                              ? "text-red-600 dark:text-red-400"
                              : isVarLow
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {v.stockQuantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                            isVarOut
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : isVarLow
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {isVarOut ? "Out of Stock" : isVarLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <button
                          onClick={() => handleOpenRestock(v.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. TAB 3: Recent Sales History Lines */}
      {activeTab === "sales" && (
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-warmgray-50 dark:bg-warmgray-950/80 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 text-start">Order ID</th>
                  <th className="py-3 px-4 text-start">Invoice #</th>
                  <th className="py-3 px-4 text-start">Quantity</th>
                  <th className="py-3 px-4 text-start">Unit Price</th>
                  <th className="py-3 px-4 text-start">Line Total</th>
                  <th className="py-3 px-4 text-start">Payment & Type</th>
                  <th className="py-3 px-4 text-start">Cashier</th>
                  <th className="py-3 px-4 text-end">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800/80">
                {recentSales.map((sale: any) => {
                  const orderId =
                    sale.orderNumber ||
                    (sale.invoiceNumber
                      ? sale.invoiceNumber.replace("INV-", "ORD-")
                      : `ORD-${(sale.saleId || sale.id).slice(0, 6).toUpperCase()}`);

                  return (
                    <tr key={sale.id} className="hover:bg-warmgray-50/70 dark:hover:bg-warmgray-800/40 transition">
                      <td className="py-3 px-4">
                        <Link
                          href={`/orders/${sale.saleId || sale.id}`}
                          className="font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center"
                        >
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                            {orderId}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-warmgray-600 dark:text-warmgray-400">
                        <span>{sale.invoiceNumber}</span>
                      </td>
                      <td className="py-3 px-4 font-black">{sale.quantity} units</td>
                      <td className="py-3 px-4 font-medium text-warmgray-500">{formatCurrency(sale.unitPrice)}</td>
                      <td className="py-3 px-4 font-black text-amber-600 dark:text-amber-400">
                        {formatCurrency(sale.lineTotal)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold">{sale.paymentMethod}</span> •{" "}
                        <span className="text-warmgray-500">{sale.orderType}</span>
                      </td>
                      <td className="py-3 px-4 font-bold">{sale.cashierName}</td>
                      <td className="py-3 px-4 text-end font-mono text-warmgray-500">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
                {recentSales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-warmgray-400">
                      No sales recorded for this product yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Dedicated Stock Movement Modal for this product */}
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
                    Record Stock Movement for {prodName}
                  </h3>
                  <p className="text-[11px] text-warmgray-500 font-medium">
                    Current base stock: {item.stockQuantity} units
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

            <form onSubmit={handleSubmitMovement} className="p-5 space-y-4">
              {/* Variant Selector (if matrix variant mode) */}
              {item.variationMode === "VARIANT" && item.variants && (
                <div>
                  <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5">
                    Select Variant Matrix Target
                  </label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold text-warmgray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Base Product Stock ({item.stockQuantity} in stock)</option>
                    {item.variants.map((v) => {
                      const desc = v.variantOptions?.map((vo) => vo.variationOption.nameEn).join(" / ");
                      return (
                        <option key={v.id} value={v.id}>
                          {desc || v.sku} ({v.stockQuantity} units in stock)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Movement Type Selector */}
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
                    <span>Restock / Inflow (+)</span>
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
                    <span>Audit Count (+/-)</span>
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
                  placeholder="e.g. 20"
                  className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold text-warmgray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5">
                  Reason Note
                </label>
                <input
                  type="text"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="e.g. Weekly inventory delivery batch"
                  className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-warmgray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
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
                  {isSubmitting ? "Logging..." : "Save Movement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
