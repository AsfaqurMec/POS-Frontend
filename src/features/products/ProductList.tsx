"use client";

import React from "react";
import Link from "next/link";
import { Coffee, Edit2, Trash2, Sliders, Layers, Package, AlertTriangle, CheckCircle2, XCircle, Eye } from "lucide-react";
import { Item } from "@/types";
import { useLangStore } from "@/store/langStore";
import { useAuthStore } from "@/store/authStore";
import { getMediaUrl } from "@/lib/env";

interface ProductListProps {
  items: Item[];
  isLoading: boolean;
  viewMode?: "table" | "grid";
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (item: Item) => void;
  onOpenVariations: (item: Item) => void;
}

export function ProductList({
  items,
  isLoading,
  viewMode = "table",
  onEdit,
  onDelete,
  onToggleStatus,
  onOpenVariations,
}: ProductListProps) {
  const { lang, t } = useLangStore();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";

  if (isLoading) {
    return (
      <div className="w-full bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-xl p-6 shadow-sm">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-warmgray-100 dark:bg-warmgray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-xl p-12 shadow-sm flex flex-col items-center justify-center text-center text-warmgray-400">
        <Coffee className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-bold text-sm text-warmgray-800 dark:text-warmgray-200">
          No products found
        </p>
        <p className="text-xs text-warmgray-600 dark:text-warmgray-400 mt-1 font-medium">
          Try clearing search filters or add a new coffee or menu item
        </p>
      </div>
    );
  }

  // Grid View Mode
  if (viewMode === "grid") {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const itemName = lang === "ar" ? item.nameAr : item.nameEn;
            const itemSub = lang === "ar" ? item.nameEn : item.nameAr;
            const isOutOfStock = item.stockEnabled && item.stockQuantity <= 0;
            const isLowStock = item.stockEnabled && item.stockQuantity > 0 && item.stockQuantity <= 5;

            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-xl overflow-hidden shadow-sm hover:border-amber-400/80 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative w-full aspect-[4/3] bg-warmgray-100 dark:bg-warmgray-800 overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={getMediaUrl(item.imageUrl)}
                        alt={itemName}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                          !item.active || isOutOfStock ? "grayscale contrast-75 opacity-70" : ""
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-warmgray-400">
                        <Coffee className="w-10 h-10" />
                      </div>
                    )}

                    {/* Stock Badges */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-red-950/40 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    {/* Variation Mode Pill */}
                    {item.variationMode === "OPTION" && (
                      <span className="absolute bottom-2.5 end-2.5 bg-amber-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-sm">
                        <Layers className="w-3 h-3" />
                        Options
                      </span>
                    )}
                    {item.variationMode === "VARIANT" && (
                      <span className="absolute bottom-2.5 end-2.5 bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-sm">
                        <Package className="w-3 h-3" />
                        Matrix
                      </span>
                    )}

                    {/* Category Tag */}
                    {item.category && (
                      <span className="absolute top-2.5 start-2.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-sm">
                        {lang === "ar" ? item.category.nameAr : item.category.nameEn}
                      </span>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.active ? "bg-emerald-500" : "bg-red-500"
                        }`}
                        title={item.active ? "Active" : "Inactive"}
                      />
                      {item.sku && (
                        <span className="font-mono text-[10px] text-warmgray-600 dark:text-warmgray-400 font-bold">
                          {item.sku}
                        </span>
                      )}
                    </div>

                    <div>
                      <Link
                        href={`/products/${item.id}`}
                        className="font-black text-sm text-warmgray-900 dark:text-white leading-tight line-clamp-1 hover:text-amber-600 dark:hover:text-amber-400 transition"
                      >
                        {itemName}
                      </Link>
                      {itemSub && (
                        <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium line-clamp-1 mt-0.5">
                          {itemSub}
                        </p>
                      )}
                    </div>

                    {/* Stock & Price info */}
                    <div className="pt-2 border-t border-warmgray-100 dark:border-warmgray-800 flex items-center justify-between">
                      <span className="text-base font-black text-amber-600 dark:text-amber-400">
                        {item.basePrice.toFixed(2)}{" "}
                        <span className="text-xs font-bold text-warmgray-600 dark:text-warmgray-400">
                          {t.common.sar}
                        </span>
                      </span>

                      {item.stockEnabled ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            isOutOfStock
                              ? "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300"
                              : isLowStock
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {item.stockQuantity} units
                        </span>
                      ) : (
                        <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-bold">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-warmgray-50 dark:bg-warmgray-950/80 border-t border-warmgray-100 dark:border-warmgray-800 flex items-center justify-between">
                  <button
                    onClick={() => !isGuest && onToggleStatus(item)}
                    disabled={isGuest}
                    title={isGuest ? "Status change disabled in Guest Mode" : undefined}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition ${
                      isGuest ? "opacity-60 cursor-not-allowed " : ""
                    }${
                      item.active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                    }`}
                  >
                    {item.active ? "Active" : "Inactive"}
                  </button>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/products/${item.id}`}
                      className="p-1.5 text-warmgray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-xl transition"
                      title="View Details & Movements"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {item.variationMode !== "NONE" && (
                      <button
                        onClick={() => onOpenVariations(item)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition"
                        title="Manage Options & Variants"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                    )}
                    {!isGuest && (
                      <>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-xl transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Table View Mode
  return (
    <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-start text-xs">
          <thead className="bg-warmgray-50 dark:bg-warmgray-950/80 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800 sticky top-0 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-5 text-start">Product</th>
              <th className="py-3.5 px-4 text-start">Category</th>
              <th className="py-3.5 px-4 text-start">SKU / Barcode</th>
              <th className="py-3.5 px-4 text-start">Base Price</th>
              <th className="py-3.5 px-4 text-start">Variations</th>
              <th className="py-3.5 px-4 text-start">Stock Level</th>
              <th className="py-3.5 px-4 text-start">Status</th>
              <th className="py-3.5 px-5 text-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800/80">
            {items.map((item) => {
              const itemName = lang === "ar" ? item.nameAr : item.nameEn;
              const itemSub = lang === "ar" ? item.nameEn : item.nameAr;
              const isOutOfStock = item.stockEnabled && item.stockQuantity <= 0;
              const isLowStock = item.stockEnabled && item.stockQuantity > 0 && item.stockQuantity <= 5;

              return (
                <tr
                  key={item.id}
                  className="hover:bg-warmgray-50/70 dark:hover:bg-warmgray-800/40 transition group"
                >
                  {/* Image & Title */}
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-warmgray-100 dark:bg-warmgray-800 flex items-center justify-center overflow-hidden border border-warmgray-200 dark:border-warmgray-700 shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={getMediaUrl(item.imageUrl)}
                            alt=""
                            className={`w-full h-full object-cover ${
                              !item.active ? "grayscale opacity-60" : ""
                            }`}
                          />
                        ) : (
                          <Coffee className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/products/${item.id}`}
                          className="font-bold text-sm text-warmgray-900 dark:text-white leading-tight hover:text-amber-600 dark:hover:text-amber-400 transition"
                        >
                          {itemName}
                        </Link>
                        {itemSub && (
                          <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium mt-0.5">{itemSub}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 font-semibold text-warmgray-700 dark:text-warmgray-300">
                    {item.category ? (lang === "ar" ? item.category.nameAr : item.category.nameEn) : "-"}
                  </td>

                  {/* SKU / Barcode */}
                  <td className="py-3 px-4 font-mono text-[11px] text-warmgray-700 dark:text-warmgray-300 font-medium">
                    <div>{item.sku || "—"}</div>
                    {item.barcode && (
                      <div className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-mono font-medium">{item.barcode}</div>
                    )}
                  </td>

                  {/* Base Price */}
                  <td className="py-3 px-4 font-black text-sm text-amber-600 dark:text-amber-400">
                    {item.basePrice.toFixed(2)}{" "}
                    <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-bold">SAR</span>
                  </td>

                  {/* Mode / Variations */}
                  <td className="py-3 px-4">
                    {item.variationMode === "OPTION" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Layers className="w-3 h-3" />
                        <span>Options</span>
                      </span>
                    )}
                    {item.variationMode === "VARIANT" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        <Package className="w-3 h-3" />
                        <span>Matrix</span>
                      </span>
                    )}
                    {item.variationMode === "NONE" && (
                      <span className="text-[10px] font-bold text-warmgray-600 dark:text-warmgray-400">Standard</span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="py-3 px-4">
                    {item.stockEnabled ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                          isOutOfStock
                            ? "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300"
                            : isLowStock
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        {isOutOfStock ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : isLowStock ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{item.stockQuantity} in stock</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-bold">Untracked</span>
                    )}
                  </td>

                  {/* Active Toggle */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => !isGuest && onToggleStatus(item)}
                      disabled={isGuest}
                      title={isGuest ? "Status change disabled in Guest Mode" : undefined}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl transition ${
                        isGuest ? "opacity-60 cursor-not-allowed " : ""
                      }${
                        item.active
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                          : "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.active ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <span>{item.active ? "Active" : "Inactive"}</span>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-5 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/products/${item.id}`}
                        className="p-1.5 text-warmgray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition"
                        title="View Details & Movements"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {item.variationMode !== "NONE" && (
                        <button
                          onClick={() => onOpenVariations(item)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition"
                          title="Manage Variations & Options"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                      )}
                      {!isGuest && (
                        <>
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}