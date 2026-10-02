"use client";

import React from "react";
import { useItems, useCategories } from "@/hooks/useQueries";
import { usePosStore } from "@/store/posStore";
import { useLangStore } from "@/store/langStore";
import { useCartStore } from "@/store/cartStore";
import {
  Coffee,
  Layers,
  Package,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Item } from "@/types";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { getMediaUrl } from "@/lib/env";

export function ProductGrid() {
  const {
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    openVariationModal,
  } = usePosStore();
  const { lang, t, dir } = useLangStore();
  const addToCart = useCartStore((s) => s.addToCart);

  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const { data: items, isLoading: isItemsLoading } = useItems(
    selectedCategoryId === "all_categories" ? "all" : selectedCategoryId,
    searchQuery
  );

  const isAllCategoriesView = selectedCategoryId === "all_categories" && !searchQuery.trim();

  const q = searchQuery.toLowerCase().trim();

  const filteredCategories = (categories || []).filter((cat) => {
    if (!q) return true;
    return (
      (cat.nameEn || "").toLowerCase().includes(q) ||
      (cat.nameAr || "").toLowerCase().includes(q) ||
      (cat.descriptionEn && cat.descriptionEn.toLowerCase().includes(q))
    );
  });

  const displayedItems = (items || []).filter((item) => {
    if (!q) return true;
    const nameEn = (item.nameEn || "").toLowerCase();
    const nameAr = (item.nameAr || "").toLowerCase();
    const sku = (item.sku || "").toLowerCase();
    const barcode = (item.barcode || "").toLowerCase();
    return nameEn.includes(q) || nameAr.includes(q) || sku.includes(q) || barcode.includes(q);
  });

  const handleProductClick = (item: Item) => {
    if (item.stockEnabled && item.stockQuantity <= 0) {
      return;
    }
    if (item.variationMode === "NONE") {
      addToCart(item, null, [], 1);
    } else {
      openVariationModal(item);
    }
  };

  // Hardware HID Barcode Scanner Listener
  useBarcodeScanner({
    onScan: (barcode) => {
      const code = barcode.trim().toLowerCase();
      const allItems = items || [];
      const matched = allItems.find(
        (i) =>
          (i.barcode && i.barcode.toLowerCase() === code) ||
          (i.sku && i.sku.toLowerCase() === code)
      );
      if (matched) {
        handleProductClick(matched);
      }
    },
  });

  const getItemBadge = (item: Item): "popular" | "new" | null => {
    const name = (item.nameEn || "").toLowerCase();
    if (
      name.includes("spanish") ||
      name.includes("caramel") ||
      name.includes("croissant") ||
      name.includes("cappuccino")
    ) {
      return "popular";
    }
    if (
      name.includes("nitro") ||
      name.includes("affogato") ||
      name.includes("matcha") ||
      name.includes("cold brew")
    ) {
      return "new";
    }
    return null;
  };

  const ArrowIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Main Grid Area */}
      {isAllCategoriesView ? (
        /* ALL CATEGORIES VIEW */
        <div className="flex-1 overflow-y-auto p-1 no-scrollbar">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#231815] dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span>{t.pos.exploreCategories || "Explore Categories"}</span>
              </h2>
              <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-0.5">
                {t.pos.categoriesSubtitle ||
                  "Select a category to view and order its drinks, beans, and treats"}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-[#E8DFD7] dark:border-amber-900/40">
              {filteredCategories.length} {t.pos.productsCount || "Categories"}
            </span>
          </div>

          {isCategoriesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-[#1E140E] border border-[#E8DFD7] dark:border-[#382418] rounded-2xl animate-pulse aspect-[16/11]"
                />
              ))}
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
              {filteredCategories.map((cat) => {
                const name = lang === "ar" ? cat.nameAr : cat.nameEn;
                const subName = lang === "ar" ? cat.nameEn : cat.nameAr;
                const count = cat._count?.items ?? 0;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="group relative flex flex-col bg-white dark:bg-[#1E140E] border border-[#E8DFD7] dark:border-[#382418] rounded-2xl overflow-hidden text-start shadow-xs hover:border-amber-600 dark:hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
                  >
                    {/* Category Image Header */}
                    <div className="w-full aspect-[16/10] bg-[#F5EFE6] dark:bg-[#281A12] flex items-center justify-center overflow-hidden relative">
                      {cat.imageUrl ? (
                        <img
                          src={getMediaUrl(cat.imageUrl)}
                          alt={name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                          <Coffee className="w-6 h-6" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      {/* Item Count Floating Badge */}
                      <span className="absolute top-2 end-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/90 dark:bg-black/80 text-amber-900 dark:text-amber-200 shadow-sm backdrop-blur-xs">
                        {count} Items
                      </span>

                      {/* Name Overlay at Bottom of Image */}
                      <div className="absolute bottom-2.5 start-2.5 end-2.5 text-white">
                        <h3 className="font-bold text-sm leading-tight drop-shadow-sm">
                          {name}
                        </h3>
                        {subName && (
                          <p className="text-[10px] text-warmgray-200/90 drop-shadow line-clamp-1 mt-0.5">
                            {subName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-2.5 flex items-center justify-between bg-warmgray-50/50 dark:bg-[#251810]">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 group-hover:text-amber-700 dark:group-hover:text-amber-200 transition">
                        {t.categories.viewDetails || "View Items"}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-[#322015] text-amber-800 dark:text-amber-300 flex items-center justify-center group-hover:bg-amber-700 dark:group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
                        <ArrowIcon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-warmgray-600 dark:text-warmgray-400">
              <LayoutGrid className="w-12 h-12 mb-2 opacity-30 text-warmgray-400" />
              <p className="text-sm font-semibold">
                {t.categories.noProducts || "No categories found"}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* PRODUCTS GRID VIEW */
        <div className="flex-1 overflow-y-auto p-0.5 no-scrollbar">
          {isItemsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-2.5 sm:gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(
                (i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-[#1E140E] border border-[#E8DFD7] dark:border-[#382418] rounded-xl animate-pulse aspect-[3/4]"
                  />
                )
              )}
            </div>
          ) : displayedItems && displayedItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-2">
              {displayedItems.map((item) => {
                const name = lang === "ar" ? item.nameAr : item.nameEn;
                const hasOptions = item.variationMode === "OPTION";
                const isVariant = item.variationMode === "VARIANT";
                const isOutOfStock =
                  item.stockEnabled && item.stockQuantity <= 0;
                const badge = getItemBadge(item);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleProductClick(item)}
                    disabled={isOutOfStock}
                    className={`group relative flex flex-col bg-white dark:bg-[#1E140E] border rounded-xl overflow-hidden text-start shadow-xs transition-all duration-200 ${
                      isOutOfStock
                        ? "opacity-60 cursor-not-allowed border-[#E8DFD7] dark:border-[#382418]"
                        : "border-[#E8DFD7] dark:border-[#382418] hover:border-[#D4A373] dark:hover:border-amber-600 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                    }`}
                  >
                    {/* Product Photo Container */}
                    <div className="w-full aspect-square bg-[#F5EFE6] dark:bg-[#281A12] flex items-center justify-center overflow-hidden relative">
                      {item.imageUrl ? (
                        <img
                          src={getMediaUrl(item.imageUrl)}
                          alt={name}
                          className={`w-full h-full object-cover transition-transform duration-300 ${
                            isOutOfStock
                              ? "grayscale contrast-75"
                              : "group-hover:scale-105"
                          }`}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                          {isVariant ? (
                            <Package className="w-6 h-6" />
                          ) : (
                            <Coffee className="w-6 h-6" />
                          )}
                        </div>
                      )}

                      {/* Tag Badges: Popular / New / Out of Stock */}
                      <div className="absolute top-1.5 end-1.5 flex flex-col gap-1 items-end z-10">
                        {isOutOfStock ? (
                          <span className="bg-[#DC2626] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                            {t.pos.outOfStock}
                          </span>
                        ) : badge === "popular" ? (
                          <span className="bg-[#EA580C] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                            Popular
                          </span>
                        ) : badge === "new" ? (
                          <span className="bg-[#9333EA] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                            New
                          </span>
                        ) : null}
                      </div>

                      {/* Options / Variants indicator at bottom right of image */}
                      {!isOutOfStock && hasOptions && (
                        <span className="absolute bottom-1.5 end-1.5 bg-black/60 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 backdrop-blur-xs">
                          <Layers className="w-2.5 h-2.5" />
                          <span>{t.pos.options}</span>
                        </span>
                      )}
                      {!isOutOfStock && isVariant && (
                        <span className="absolute bottom-1.5 end-1.5 bg-black/60 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 backdrop-blur-xs">
                          <Package className="w-2.5 h-2.5" />
                          <span>{t.pos.variants}</span>
                        </span>
                      )}
                    </div>

                    {/* Product Name, Price & Stock underneath image */}
                    <div className="p-2.5 pt-2 pb-2.5 flex flex-col text-start">
                      <h3 className="font-bold text-xs sm:text-sm text-[#231815] dark:text-warmgray-100 truncate leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                        {name}
                      </h3>
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#F5EFE6] dark:border-[#2D1D14]">
                        <span className="font-black text-xs text-[#5C3E2E] dark:text-amber-300 tracking-tight">
                          SAR {item.basePrice.toFixed(2)}
                        </span>
                        {item.stockEnabled ? (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                              isOutOfStock
                                ? "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 border-red-200 dark:border-red-900/40"
                                : item.stockQuantity <= 5
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/40"
                                : "bg-[#F5EFE6] dark:bg-[#2D1D14] text-warmgray-700 dark:text-warmgray-300 border-[#E8DFD7] dark:border-[#382418]"
                            }`}
                          >
                            {isOutOfStock
                              ? lang === "ar"
                                ? "نفذ المخزون"
                                : "0 Stock"
                              : `${item.stockQuantity} ${lang === "ar" ? "متوفر" : "in stock"}`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 px-1.5 py-0.5 rounded-md shrink-0">
                            {lang === "ar" ? "متوفر" : "In Stock"}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-warmgray-600 dark:text-warmgray-400">
              <Coffee className="w-12 h-12 mb-2 opacity-30 text-warmgray-400" />
              <p className="text-sm font-semibold">No products found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}