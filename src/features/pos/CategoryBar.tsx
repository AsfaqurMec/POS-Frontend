"use client";

import React, { useRef } from "react";
import { useCategories } from "@/hooks/useQueries";
import { usePosStore } from "@/store/posStore";
import { useLangStore } from "@/store/langStore";
import {
  Coffee,
  LayoutGrid,
  GlassWater,
  Leaf,
  Flame,
  Sparkles,
  UtensilsCrossed,
  Croissant,
  CakeSlice,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function CategoryBar() {
  const { data: categories, isLoading } = useCategories();
  const { selectedCategoryId, setSelectedCategoryId } = usePosStore();
  const { lang, t, dir } = useLangStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const multiplier =
        dir === "rtl"
          ? direction === "left"
            ? 240
            : -240
          : direction === "left"
          ? -240
          : 240;
      scrollContainerRef.current.scrollBy({ left: multiplier, behavior: "smooth" });
    }
  };

  const getCategoryIcon = (nameEn: string) => {
    const n = nameEn.toLowerCase();
    if (n.includes("hot")) return <Coffee className="w-8 h-8 shrink-0" />;
    if (n.includes("ice") || n.includes("cold")) return <GlassWater className="w-5 h-8 shrink-0" />;
    if (n.includes("tea") || n.includes("matcha")) return <Leaf className="w-8 h-8 shrink-0" />;
    if (n.includes("pour") || n.includes("brew") || n.includes("v60"))
      return <Flame className="w-8 h-8 shrink-0" />;
    if (n.includes("refresher") || n.includes("mojito"))
      return <Sparkles className="w-8 h-8 shrink-0" />;
    if (n.includes("sandwich") || n.includes("food"))
      return <UtensilsCrossed className="w-8 h-8 shrink-0" />;
    if (n.includes("bakery") || n.includes("croissant"))
      return <Croissant className="w-8 h-8 shrink-0" />;
    if (n.includes("cake") || n.includes("dessert"))
      return <CakeSlice className="w-8 h-8 shrink-0" />;
    if (n.includes("bean") || n.includes("merchandise"))
      return <ShoppingBag className="w-8 h-8 shrink-0" />;
    return <Coffee className="w-8 h-8 shrink-0" />;
  };

  if (isLoading) {
    return (
      <div className="flex gap-2.5 overflow-x-auto py-1 px-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="h-[74px] w-24 bg-[#EDE5DC] rounded-2xl animate-pulse shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-1.5 shrink-0 select-none">
      {/* Scroll Left Button */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll categories left"
        className="w-8 h-8 rounded-xl bg-white dark:bg-[#1E140E] border border-[#E8DFD7] dark:border-[#382418] shadow-sm flex items-center justify-center text-[#5C3E2E] dark:text-warmgray-300 hover:text-[#2B1D16] dark:hover:text-white hover:border-amber-500 hover:shadow-md transition-all shrink-0 active:scale-95 z-10"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Categories Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-center gap-2 overflow-x-auto py-1 px-0.5 scroll-smooth no-scrollbar"
      >
        {/* 1. "All Items" Category Card */}
        <button
          onClick={() => setSelectedCategoryId("all")}
          className={`flex flex-col items-center justify-center min-w-[82px] sm:min-w-[120px] h-[60px] sm:h-[65px] px-2 rounded-lg transition-all duration-200 shrink-0 ${
            selectedCategoryId === "all"
              ? "bg-[#2B1D16] dark:bg-amber-600 text-white shadow-md ring-2 ring-[#2B1D16] dark:ring-amber-500 ring-offset-0"
              : "bg-white dark:bg-[#1E140E] text-[#2B1D16] dark:text-warmgray-200 border border-[#E8DFD7] dark:border-[#382418] hover:border-[#D4A373] dark:hover:border-amber-600/60 hover:shadow-sm"
          }`}
        >
          <div className="mb-1">
            <LayoutGrid
              className={`w-7 h-7 ${
                selectedCategoryId === "all" ? "text-amber-200" : "text-[#7A5A48] dark:text-amber-300/80"
              }`}
            />
          </div>
          <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap tracking-tight">
            All Items
          </span>
        </button>

        {/* 2. Individual Category Cards */}
        {categories?.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const name = lang === "ar" ? cat.nameAr : cat.nameEn;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`flex flex-col items-center justify-center min-w-[82px] sm:min-w-[120px] h-[60px] sm:h-[70px] px-2 rounded-lg transition-all duration-200 shrink-0 ${
                isSelected
                  ? "bg-[#2B1D16] dark:bg-amber-600 text-white shadow-md ring-2 ring-[#2B1D16] dark:ring-amber-500 ring-offset-0"
                  : "bg-white dark:bg-[#1E140E] text-[#2B1D16] dark:text-warmgray-200 border border-[#E8DFD7] dark:border-[#382418] hover:border-[#D4A373] dark:hover:border-amber-600/60 hover:shadow-sm"
              }`}
            >
              <div
                className={`mb-1 transition-colors ${
                  isSelected ? "text-amber-200" : "text-[#7A5A48] dark:text-amber-300/80"
                }`}
              >
                {getCategoryIcon(cat.nameEn)}
              </div>
              <span className="text-[11px] sm:text-xs font-bold whitespace-nowrap tracking-tight truncate max-w-[80px]">
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll categories right"
        className="w-8 h-8 rounded-xl bg-white dark:bg-[#1E140E] border border-[#E8DFD7] dark:border-[#382418] shadow-sm flex items-center justify-center text-[#5C3E2E] dark:text-warmgray-300 hover:text-[#2B1D16] dark:hover:text-white hover:border-amber-500 hover:shadow-md transition-all shrink-0 active:scale-95 z-10"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}