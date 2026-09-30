"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useBusiness } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Wifi, Eye } from "lucide-react";

const adminOnlyRoutes = ["/dashboard", "/products", "/inventory", "/stock-movements", "/users", "/settings"];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { data: business } = useBusiness();
  const { lang } = useLangStore();

  const businessName =
    lang === "ar"
      ? business?.nameAr || business?.nameEn || "POS"
      : business?.nameEn || business?.nameAr || "POS";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    // Only restrict STAFF from admin-only routes. Guests can view all routes in read-only mode!
    if (user && user.role === "STAFF") {
      const isAdminRoute = adminOnlyRoutes.some(
        (r) => pathname === r || pathname.startsWith(`${r}/`)
      );
      if (isAdminRoute) {
        router.replace("/pos");
      }
    }
  }, [user, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#18110B]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-amber-200">
            {businessName ? `${businessName}...` : "Loading POS..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F7F3EE] dark:bg-[#120B07] overflow-hidden font-sans">
      <Header />
      {user?.role === "GUEST" && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black px-4 py-1.5 flex items-center justify-between text-xs font-bold shadow-md z-30 shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 shrink-0 text-black" />
            <span>
              {lang === "ar"
                ? "أنت في وضع الزائر (عرض فقط). تم تعطيل إنشاء أو تعديل أو حفظ أو حذف أي بيانات."
                : "Guest Mode (View-Only Active) — Creating, modifying, and deleting data is disabled."}
            </span>
          </div>
          <span className="text-[10px] bg-black/20 text-black font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
            {lang === "ar" ? "عرض فقط" : "View Only"}
          </span>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className={`flex-1 flex flex-col min-w-0 ${pathname === "/pos" ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"}`}>
          {children}
        </main>
      </div>

      {/* Bottom Luxury Status Bar */}
      <footer className="h-7 bg-[#160F0A] border-t border-[#261A12] px-4 sm:px-6 flex items-center justify-between text-[11px] text-[#A69485] select-none shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
          <span className="text-[#5A4537]">•</span>
          <span className="flex items-center gap-1 text-[#8C7A6B]">
            <Wifi className="w-3 h-3 text-[#A69485]" />
            {businessName}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-[#8C7A6B] font-medium tracking-wide">
          <span>{businessName}</span>
          <span>•</span>
          <span>{lang === "ar" ? "نظام نقاط البيع" : "POS Terminal"}</span>
        </div>

        <div className="flex items-center gap-1.5 text-amber-200/90 text-xs italic font-medium truncate max-w-xs">
          <span>{lang === "ar" ? business?.receiptFooterAr || businessName : business?.receiptFooterEn || businessName}</span>
        </div>
      </footer>
    </div>
  );
}