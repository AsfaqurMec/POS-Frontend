"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLangStore } from "@/store/langStore";
import { usePosStore } from "@/store/posStore";
import { useAuthStore } from "@/store/authStore";
import { getMediaUrl } from "@/lib/env";
import { Category, Item } from "@/types";
import { CategoryModal } from "@/features/categories/CategoryModal";
import {
  ArrowLeft,
  ArrowRight,
  FolderTree,
  Coffee,
  Package,
  Layers,
  Store,
  Edit2,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  ExternalLink,
  Tag,
  Barcode,
  LayoutGrid,
  List,
} from "lucide-react";
import { Pagination } from "@/components/common/Pagination";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { lang, t, dir } = useLangStore();
  const { setSelectedCategoryId } = usePosStore();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";

  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const fetchCategory = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await api.get<Category>(`/categories/${id}`);
      setCategory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load category");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategory();
  }, [id]);

  useEffect(() => {
    setPage(1);
  }, [search, viewMode]);

  const items = category?.items || [];
  const filteredItems = React.useMemo(() => {
    if (!items.length) return [];
    if (!search) return items;
    const q = search.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.nameEn.toLowerCase().includes(q) ||
        item.nameAr.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.toLowerCase().includes(q))
    );
  }, [items, search]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const handleSaveCategory = async (formData: FormData) => {
    await api.patch(`/categories/${id}`, formData, true);
    await fetchCategory();
  };

  const handleOpenInPos = () => {
    if (category) {
      setSelectedCategoryId(category.id);
      router.push("/pos");
    }
  };

  const ArrowBack = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="h-8 w-44 bg-warmgray-200 dark:bg-warmgray-800 rounded-xl animate-pulse" />
        <div className="h-56 bg-warmgray-200 dark:bg-warmgray-800 rounded-3xl animate-pulse" />
        <div className="h-96 bg-warmgray-200 dark:bg-warmgray-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
          <FolderTree className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-warmgray-900 dark:text-white">
          {error || "Category not found"}
        </h2>
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md hover:bg-amber-700 transition"
        >
          <ArrowBack className="w-4 h-4" />
          <span>{t.categories.backToCategories}</span>
        </Link>
      </div>
    );
  }

  const totalItems = items.length;
  const inStockItems = items.filter(
    (i) => !i.stockEnabled || i.stockQuantity > 0
  ).length;
  const outOfStockItems = items.filter(
    (i) => i.stockEnabled && i.stockQuantity <= 0
  ).length;
  const totalStockUnits = items.reduce(
    (sum, i) => sum + (i.stockEnabled ? i.stockQuantity : 0),
    0
  );
  const totalValuation = items.reduce(
    (sum, i) => sum + (i.stockEnabled ? i.stockQuantity * i.basePrice : 0),
    0
  );
  const avgPrice = totalItems > 0 ? items.reduce((sum, i) => sum + i.basePrice, 0) / totalItems : 0;

  const name = lang === "ar" ? category.nameAr : category.nameEn;
  const subName = lang === "ar" ? category.nameEn : category.nameAr;
  const description =
    lang === "ar"
      ? category.descriptionAr || category.descriptionEn
      : category.descriptionEn || category.descriptionAr;

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-16">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 text-xs font-bold text-warmgray-600 dark:text-warmgray-400 hover:text-amber-600 transition group"
        >
          <ArrowBack className="w-4 h-4 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
          <span>{t.categories.backToCategories}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenInPos}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-900/30 transition active:scale-95"
          >
            <Store className="w-4 h-4" />
            <span>{t.categories.openInPos}</span>
          </button>
          {!isGuest && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 text-warmgray-700 dark:text-warmgray-200 hover:bg-warmgray-50 dark:hover:bg-warmgray-800 font-bold text-xs shadow-sm transition"
            >
              <Edit2 className="w-4 h-4 text-amber-600" />
              <span>{t.common.edit}</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Category Banner */}
      <div className="relative bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row">
        {/* Category Thumbnail / Cover */}
        <div className="relative w-full md:w-72 h-52 md:h-auto bg-gradient-to-tr from-warmgray-100 to-warmgray-50 dark:from-warmgray-800 dark:to-warmgray-900 shrink-0 overflow-hidden">
          {category.imageUrl ? (
            <img
              src={getMediaUrl(category.imageUrl)}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-amber-700/60 dark:text-amber-400/60">
              <FolderTree className="w-20 h-20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
        </div>

        {/* Category Info */}
        <div className="flex-1 p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  category.active
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                    : "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300"
                }`}
              >
                {category.active ? t.common.active : t.common.inactive}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300">
                Display Order: #{category.sortOrder}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-warmgray-900 dark:text-white tracking-tight">
              {name}
            </h1>
            {subName && (
              <p className="text-sm font-semibold text-warmgray-600 dark:text-warmgray-400 mt-0.5">
                {subName}
              </p>
            )}

            {description && (
              <p className="text-xs text-warmgray-700 dark:text-warmgray-300 mt-3 leading-relaxed max-w-2xl font-medium">
                {description}
              </p>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-4 border-t border-warmgray-100 dark:border-warmgray-800">
            <div>
              <p className="text-[11px] text-warmgray-700 dark:text-warmgray-400 font-bold">Total Products</p>
              <p className="text-lg font-black text-warmgray-900 dark:text-white mt-0.5">
                {totalItems}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-warmgray-700 dark:text-warmgray-400 font-bold">In Stock</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {inStockItems}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-warmgray-700 dark:text-warmgray-400 font-bold">Out of Stock</p>
              <p className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">
                {outOfStockItems}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-warmgray-700 dark:text-warmgray-400 font-bold">Total Units</p>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {totalStockUnits}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-warmgray-700 dark:text-warmgray-400 font-bold">Valuation</p>
              <p className="text-lg font-black text-warmgray-900 dark:text-white mt-0.5">
                {totalValuation.toFixed(0)}{" "}
                <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-medium">SAR</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-warmgray-700 dark:text-warmgray-400 font-bold">Avg Price</p>
              <p className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">
                {avgPrice.toFixed(1)}{" "}
                <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-medium">SAR</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Products Header Toolbar */}
        <div className="p-5 border-b border-warmgray-100 dark:border-warmgray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-warmgray-900 dark:text-white flex items-center gap-2">
              <Coffee className="w-5 h-5 text-amber-600" />
              <span>{t.categories.productsInCategory}</span>
            </h2>
            <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-0.5">
              Showing {filteredItems.length} of {totalItems} items
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-500 dark:text-warmgray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.common.search}
                className="w-full ps-10 pe-4 py-2 bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-warmgray-100 dark:bg-warmgray-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-warmgray-900 text-amber-600 shadow-sm"
                    : "text-warmgray-600 hover:text-warmgray-900 dark:text-warmgray-400"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "table"
                    ? "bg-white dark:bg-warmgray-900 text-amber-600 shadow-sm"
                    : "text-warmgray-600 hover:text-warmgray-900 dark:text-warmgray-400"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "table"
                    ? "bg-white dark:bg-warmgray-900 text-amber-600 shadow-sm"
                    : "text-warmgray-500 hover:text-warmgray-900"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{t.products.addProduct}</span>
            </Link>
          </div>
        </div>

        {/* Products Content */}
        <div className="p-5 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-warmgray-400">
              <Coffee className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-bold text-warmgray-600 dark:text-warmgray-400">
                {t.categories.noProducts}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedItems.map((item) => {
                const itemName = lang === "ar" ? item.nameAr : item.nameEn;
                const itemSub = lang === "ar" ? item.nameEn : item.nameAr;
                const isOutOfStock = item.stockEnabled && item.stockQuantity <= 0;

                return (
                  <div
                    key={item.id}
                    className="group bg-white dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl overflow-hidden shadow-sm hover:border-amber-400 hover:shadow-lg transition-all flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full aspect-[4/3] bg-warmgray-100 dark:bg-warmgray-900 overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={getMediaUrl(item.imageUrl)}
                          alt={itemName}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                            isOutOfStock ? "grayscale contrast-75" : ""
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-warmgray-400">
                          <Coffee className="w-10 h-10" />
                        </div>
                      )}

                      {/* Out of Stock Overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md">
                            {t.pos.outOfStock}
                          </span>
                        </div>
                      )}

                      {/* Variation Mode Pill */}
                      {item.variationMode === "OPTION" && (
                        <span className="absolute bottom-2 end-2 bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-sm">
                          <Layers className="w-3 h-3" />
                          Options
                        </span>
                      )}
                      {item.variationMode === "VARIANT" && (
                        <span className="absolute bottom-2 end-2 bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-sm">
                          <Package className="w-3 h-3" />
                          Matrix
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.active ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {item.sku && (
                            <span className="text-[10px] font-mono text-warmgray-600 dark:text-warmgray-400 font-bold">
                              {item.sku}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-sm text-warmgray-900 dark:text-white leading-tight line-clamp-2">
                          {itemName}
                        </h3>
                        {itemSub && (
                          <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 line-clamp-1 mt-0.5 font-medium">
                            {itemSub}
                          </p>
                        )}
                      </div>

                      {/* Price & Stock */}
                      <div className="pt-2 border-t border-warmgray-100 dark:border-warmgray-800/80 flex items-center justify-between">
                        <span className="text-base font-black text-amber-600 dark:text-amber-400">
                          {item.basePrice.toFixed(2)}{" "}
                          <span className="text-xs font-semibold text-warmgray-600 dark:text-warmgray-400">
                            {t.common.sar}
                          </span>
                        </span>

                        {item.stockEnabled ? (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                              isOutOfStock
                                ? "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300"
                                : item.stockQuantity <= 5
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {isOutOfStock
                              ? t.pos.outOfStock
                              : `${item.stockQuantity} ${t.pos.inStock}`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-warmgray-600 dark:text-warmgray-400">
                            Untracked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto border border-warmgray-200 dark:border-warmgray-800 rounded-2xl">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="bg-warmgray-50 dark:bg-warmgray-950/80 border-b border-warmgray-200 dark:border-warmgray-800 text-warmgray-700 dark:text-warmgray-300 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4 text-start">Product</th>
                    <th className="py-3 px-4 text-start">SKU / Barcode</th>
                    <th className="py-3 px-4 text-start">Type</th>
                    <th className="py-3 px-4 text-start">Base Price</th>
                    <th className="py-3 px-4 text-start">Stock Level</th>
                    <th className="py-3 px-4 text-start">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800/80">
                  {paginatedItems.map((item) => {
                    const itemName = lang === "ar" ? item.nameAr : item.nameEn;
                    const itemSub = lang === "ar" ? item.nameEn : item.nameAr;
                    const isOutOfStock = item.stockEnabled && item.stockQuantity <= 0;

                    return (
                      <tr key={item.id} className="hover:bg-warmgray-50/50 dark:hover:bg-warmgray-800/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-warmgray-100 dark:bg-warmgray-800 overflow-hidden shrink-0 border border-warmgray-200 dark:border-warmgray-700">
                              {item.imageUrl ? (
                                <img
                                  src={getMediaUrl(item.imageUrl)}
                                  alt={itemName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-warmgray-400">
                                  <Coffee className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-warmgray-900 dark:text-white leading-tight">{itemName}</p>
                              {itemSub && <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium">{itemSub}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-warmgray-700 dark:text-warmgray-300 font-bold">
                          {item.sku || "—"}
                          {item.barcode && <div className="text-[10px] text-warmgray-500 dark:text-warmgray-400 font-mono">{item.barcode}</div>}
                        </td>
                        <td className="py-3 px-4">
                          {item.variationMode === "NONE" && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300">
                              Standard
                            </span>
                          )}
                          {item.variationMode === "OPTION" && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                              Options
                            </span>
                          )}
                          {item.variationMode === "VARIANT" && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300">
                              Matrix
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                          {item.basePrice.toFixed(2)} SAR
                        </td>
                        <td className="py-3 px-4">
                          {item.stockEnabled ? (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                isOutOfStock
                                  ? "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300"
                                  : item.stockQuantity <= 5
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                              }`}
                            >
                              {item.stockQuantity} in stock
                            </span>
                          ) : (
                            <span className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-semibold">Untracked</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.active
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300"
                            }`}
                          >
                            {item.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          {filteredItems.length > 0 && (
            <div className="rounded-2xl overflow-hidden border border-warmgray-200 dark:border-warmgray-800">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[8, 12, 24, 48]}
                className="border-t-0"
              />
            </div>
          )}
        </div>
      </div>

      <CategoryModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveCategory}
        editingCategory={category}
      />
    </div>
  );
}
