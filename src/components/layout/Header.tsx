"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Sun,
  Moon,
  Globe,
  LogOut,
  Menu,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
  User,
  X,
  Lock,
  Coins,
  Tv,
  Monitor,
  Maximize2,
  Minimize2,
  Download,
} from "lucide-react";
import { useLangStore } from "@/store/langStore";
import { useAuthStore } from "@/store/authStore";
import { usePosStore } from "@/store/posStore";
import { useCartStore } from "@/store/cartStore";
import { useThemeStore } from "@/store/themeStore";
import { usePinStore } from "@/store/pinStore";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import { useBusiness, useCurrentShift } from "@/hooks/useQueries";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ManagerPinModal } from "../modals/ManagerPinModal";
import { ShiftControlModal } from "../modals/ShiftControlModal";

export function Header() {
  const { lang, toggleLang, t, dir } = useLangStore();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { data: business } = useBusiness();
  const { data: shiftData } = useCurrentShift();
  const { lockTerminal } = usePinStore();
  const { searchQuery, setSearchQuery, setMobileDrawerOpen } = usePosStore();
  const { orderType, setOrderType } = useCartStore();
  const {
    isFullscreen,
    isStandalone,
    isSupported: isFullscreenSupported,
    toggleFullscreen,
    canInstall,
    promptInstall,
  } = useDisplayMode();
  const router = useRouter();

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // Live real-time clock
  const [currentDateTime, setCurrentDateTime] = useState({
    date: "",
    time: "",
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format: Sat, 6 Sep 2025
      const dateStr = now.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      // Format: 01:24 PM
      const timeStr = now.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentDateTime({ date: dateStr, time: timeStr });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lang]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const businessTagline =
    lang === "ar"
      ? business?.receiptFooterAr || "نظام نقاط البيع المطور"
      : business?.receiptFooterEn || "Point of Sale System";

  const currency = business?.currency || "SAR";
  const hasShift = Boolean(shiftData?.shift);

  return (
    <>
      <header className="h-16 bg-[#18110B] border-b border-[#281B12] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 text-white select-none">
        {/* Left: Mobile Drawer Button + Basmala & Slogan */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-1.5 rounded-xl bg-[#281A12] text-warmgray-300 hover:text-white"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col text-start">
            <span className="font-calligraphy text-amber-200/90 text-sm sm:text-base leading-tight tracking-wide font-normal">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#A69485] font-serif tracking-wider mt-0.5 hidden xs:inline truncate max-w-[280px]">
              {businessTagline}
            </span>
          </div>
        </div>

        {/* Center: Search Capsule Bar */}
        <div className="flex-1 max-w-md mx-2 sm:mx-6 hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for coffee, drink, food or item..."
              className="w-full ps-10 pe-8 py-2 bg-[#251810] border border-[#3C271B] rounded-full text-xs text-white placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-amber-500/80 focus:border-amber-500/80 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-warmgray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Shift Drawer Button */}
          {/* Shift / Register Cash Controls (Hidden for Guest) */}
          {user?.role !== "GUEST" && (
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                hasShift
                  ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                  : "bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-900/50"
              }`}
              title="Cash Drawer & Shift Status"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {hasShift
                  ? `Till: ${(shiftData?.runningStats?.expectedCashInDrawer || shiftData?.shift?.startFloat || 0).toFixed(0)} ${currency}`
                  : "Open Shift"}
              </span>
            </button>
          )}

          {/* Customer Facing Display (CFD) Launch */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open("/cfd", "_blank", "noopener,noreferrer");
              }
            }}
            className="p-1.5 rounded-xl bg-[#251810] border border-[#382418] text-warmgray-300 hover:text-white transition flex items-center gap-1"
            title="Open Customer Facing Display in New Tab"
          >
            <Tv className="w-4 h-4 text-amber-400" />
          </button>

          {/* Kitchen Display System (KDS) Launch */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.open("/kds", "_blank", "noopener,noreferrer");
              }
            }}
            className="p-1.5 rounded-xl bg-[#251810] border border-[#382418] text-warmgray-300 hover:text-white transition flex items-center gap-1"
            title="Open Kitchen Display System in New Tab"
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
          </button>

          {/* Quick PIN Lock (Hidden for Guest) */}
          {user?.role !== "GUEST" && (
            <button
              onClick={() => lockTerminal("Cashier Locked Register")}
              className="p-1.5 rounded-xl bg-[#251810] border border-[#382418] text-amber-300 hover:text-amber-200 transition"
              title="Quick Lock (PIN Switch)"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* Sun / Moon Theme Button */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full bg-[#251810] border border-[#382418] flex items-center justify-center text-amber-300 hover:text-amber-200 hover:border-amber-500/50 transition shrink-0 active:scale-95"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-amber-200" />
            )}
          </button>

          {/* Fullscreen Toggle Button */}
          {isFullscreenSupported && (
            <button
              onClick={() => toggleFullscreen()}
              className="w-8 h-8 rounded-full bg-[#251810] border border-[#382418] flex items-center justify-center text-amber-300 hover:text-amber-200 hover:border-amber-500/50 transition shrink-0 active:scale-95"
              title={
                isFullscreen
                  ? lang === "ar"
                    ? "الخروج من الشاشة الكاملة (Esc)"
                    : "Exit Fullscreen (Esc)"
                  : lang === "ar"
                  ? "وضع ملء الشاشة (F11)"
                  : "Enter Fullscreen (F11)"
              }
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-amber-300" />
              ) : (
                <Maximize2 className="w-4 h-4 text-amber-300" />
              )}
            </button>
          )}

          {/* PWA Install Button (shown when installable and not in standalone) */}
          {canInstall && !isStandalone && (
            <button
              onClick={() => promptInstall()}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 text-xs font-semibold transition shrink-0"
              title={lang === "ar" ? "تثبيت تطبيق نقاط البيع" : "Install POS Desktop App"}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">
                {lang === "ar" ? "تثبيت التطبيق" : "Install App"}
              </span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#251810] border border-[#382418] text-xs font-medium text-warmgray-300 hover:text-white transition"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === "en" ? "AR" : "EN"}</span>
          </button>

          {/* User / Cashier / Guest Chip */}
          <div className="flex items-center gap-2 ps-2 border-s border-[#382418]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 shrink-0 ${
                user?.role === "GUEST"
                  ? "bg-amber-600/30 text-amber-300 ring-amber-500/50"
                  : "bg-gradient-to-br from-amber-600 to-amber-800 text-white ring-amber-500/30"
              }`}
            >
              <User className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-start leading-tight">
              <p className="text-[9px] uppercase tracking-wider text-warmgray-400 font-bold">
                {user?.role === "GUEST" ? "Guest (View Only)" : user?.role === "ADMIN" ? "Manager" : "Cashier"}
              </p>
              <p className="text-xs font-bold text-white truncate max-w-[110px]">
                {user?.name || (user?.role === "GUEST" ? "Guest" : "Cashier")}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-warmgray-400 hover:text-red-400 hover:bg-red-950/30 transition"
            title={t.nav.logout}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Global Modals */}
      <ManagerPinModal />
      <ShiftControlModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
      />
    </>
  );
}