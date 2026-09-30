"use client";

import React from "react";
import { CategoryBar } from "@/features/pos/CategoryBar";
import { ProductGrid } from "@/features/pos/ProductGrid";
import { CartPanel } from "@/features/pos/CartPanel";
import { VariationModal } from "@/features/pos/VariationModal";
import { ReceiptModal } from "@/features/pos/ReceiptModal";
import { useState } from "react";
import { useBusiness } from "@/hooks/useQueries";
import { getMediaUrl } from "@/lib/env";
import { Coffee } from "lucide-react";
export default function PosPage() {
  const { data: business } = useBusiness();
  const [logoError, setLogoError] = useState(false);
  const logoUrl = business?.logoUrl ? getMediaUrl(business.logoUrl) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header with branding */}
      {/* <header className="flex items-center justify-between bg-white border border-[#EADBCE] rounded-md px-4 py-2 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-md bg-[#F7F2EA] border border-[#EADBCE] flex items-center justify-center p-1.5 overflow-hidden shrink-0">
            {logoUrl && !logoError ? (
              <img src={logoUrl} alt={business?.nameEn || "Logo"} className="w-full h-full object-contain" onError={() => setLogoError(true)} />
            ) : (
              <div className="w-full h-full rounded-lg bg-amber-100/70 flex items-center justify-center text-amber-800">
                <Coffee className="w-7 h-7" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-[#231815] tracking-tight">{business?.nameEn || "POS"}</h1>
            {business?.nameAr && (
              <span className="text-xs font-bold text-[#8A7160] hidden sm:inline">• {business.nameAr}</span>
            )}
          </div>
        </div>
      </header> */}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden p-2 sm:p-3 lg:p-4 gap-2 sm:gap-3 lg:gap-4 bg-[#F7F3EE] dark:bg-[#120B07]">
        {/* Center Main Area: Categories + Products */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 gap-3">
          <CategoryBar />
          <ProductGrid />
        </div>

        {/* Right Column: Persistent Cart Panel */}
        <CartPanel />

        {/* Modals */}
        <VariationModal />
        <ReceiptModal />
      </div>
    </div>
  );
}