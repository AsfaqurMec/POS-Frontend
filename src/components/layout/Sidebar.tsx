"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Receipt,
  FolderTree,
  Coffee,
  Boxes,
  ArrowLeftRight,
  Users,
  Settings,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  X,
  ChefHat,
  Scale,
  Coins,
} from "lucide-react";
import { useLangStore } from "@/store/langStore";
import { useAuthStore } from "@/store/authStore";
import { usePosStore } from "@/store/posStore";
import { useBusiness } from "@/hooks/useQueries";
import { getMediaUrl } from "@/lib/env";

interface NavItem {
  href: string;
  label: string;
  labelKey?: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", labelKey: "dashboard", icon: LayoutDashboard, adminOnly: true },
  { href: "/pos", label: "POS", labelKey: "pos", icon: Store },
  { href: "/orders", label: "Orders", labelKey: "orders", icon: Receipt },
  { href: "/shifts", label: "Shifts", labelKey: "shifts", icon: Coins, adminOnly: true },
  { href: "/kds", label: "Kitchen Display (KDS)", labelKey: "kds", icon: ChefHat },
  { href: "/products", label: "Menu Items", labelKey: "products", icon: Coffee, adminOnly: true },
  { href: "/categories", label: "Categories", labelKey: "categories", icon: FolderTree, adminOnly: true },
  { href: "/wastage", label: "BOM & Wastage", labelKey: "wastage", icon: Scale, adminOnly: true },
  { href: "/users", label: "Users", labelKey: "users", icon: Users, adminOnly: true },
  { href: "/inventory", label: "Inventory", labelKey: "inventory", icon: Boxes, adminOnly: true },
  { href: "/stock-movements", label: "Stock Movements", labelKey: "stockMovements", icon: ArrowLeftRight, adminOnly: true },
  { href: "/settings", label: "Settings", labelKey: "settings", icon: Settings, adminOnly: true },
  { href: "/profile", label: "Profile", labelKey: "profile", icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { lang, t, dir } = useLangStore();
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, mobileDrawerOpen, setMobileDrawerOpen } = usePosStore();
  const { data: business } = useBusiness();

  const isAdmin = user?.role === "ADMIN";
  const isGuest = user?.role === "GUEST";
  const filteredNav = navItems.filter((item) => !item.adminOnly || isAdmin || isGuest);

  const defaultShopName = lang === "ar" ? "مقهى أروما للقهوة المختصة" : "MK Coffee Riyadh";
  const shopName =
    lang === "ar"
      ? business?.nameAr || business?.nameEn || defaultShopName
      : business?.nameEn || business?.nameAr || defaultShopName;

  const logoUrl = business?.logoUrl ? getMediaUrl(business.logoUrl) : "/logo.png";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#18110B] text-[#CBB9AB] border-e border-[#281B12] select-none">
      {/* Mobile Drawer Header with Close Button */}
      <div className="lg:hidden px-3.5 py-2.5 flex items-center justify-between border-b border-[#281B12]/80 bg-[#140D08]">
        <span className="text-xs font-bold text-warmgray-400">Navigation</span>
        <button
          onClick={() => setMobileDrawerOpen(false)}
          className="p-1 rounded-lg text-warmgray-400 hover:text-white hover:bg-warmgray-800"
          aria-label="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Brand Logo & Business Name from Settings */}
      <div className={`border-b border-[#281B12]/80 flex items-center justify-center transition-all duration-200 ${
        sidebarCollapsed ? "p-2 min-h-[56px]" : "p-3 min-h-[64px]"
      }`}>
        <Link
          href="/pos"
          className={`flex flex-col items-center group transition-all w-full ${
            sidebarCollapsed ? "justify-center gap-0" : "px-1 gap-2"
          }`}
          title={shopName}
        >
          {/* Logo container: small (w-9 h-9) on collapse, larger (w-14 h-14) on expand */}
          <div
            className={`rounded-lg bg-gradient-to-br from-amber-600/30 to-amber-900/40 border border-amber-500/30 flex items-center justify-center shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-all duration-200 ${
              sidebarCollapsed ? "w-9 h-9" : "w-16 h-16"
            }`}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={shopName}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target && !target.src.endsWith("/logo.png")) {
                    target.src = "/logo.png";
                  }
                }}
                className={`w-full h-full ${sidebarCollapsed ? "object-contain " : "object-contain "}`}
              />
            ) : (
              <Coffee className={`text-amber-300 transition-all ${sidebarCollapsed ? "w-4 h-4" : "w-16 h-16"}`} />
            )}
          </div>

          {/* Business Name from Settings (Hidden on collapse, only logo is shown) */}
          {!sidebarCollapsed && (
            <div className="flex flex-col items-center min-w-0 flex-1 text-center">
              <span className="font-bold text-base text-amber-100 truncate max-w-[150px] leading-tight group-hover:text-amber-200 transition-colors">
                {shopName}
              </span>
              <span className="text-[9px] text-[#A69485] font-semibold tracking-wider uppercase truncate mt-0.5">
                {lang === "ar" ? "نظام نقاط البيع" : "POS Terminal"}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/pos" && item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const label = (t.nav as any)?.[item.labelKey || ""] || item.label;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileDrawerOpen(false)}
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#3D271D] text-amber-100 shadow-md border border-amber-600/30 scale-[1.02]"
                  : "text-[#B39E8F] hover:bg-[#251810] hover:text-white"
              } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
              title={label}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? "text-amber-300" : "text-[#8C7A6B] group-hover:text-amber-200"
                }`}
              />
              {!sidebarCollapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Signature / Slogan (as seen in image) */}
      {!sidebarCollapsed && (
        <div className="p-4 pt-2 flex flex-col items-center text-center border-t border-[#281B12]/80">
          {/* Coffee line-art icon */}
          <div className="text-amber-300/80 mb-1">
            <svg
              className="w-7 h-7 mx-auto stroke-current fill-none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
              <path d="M6 2v3M10 2v3M14 2v3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-script text-amber-200 text-xl font-normal drop-shadow-sm leading-tight">
            More Than Coffee ♡
          </span>
          <span className="text-[8px] font-bold text-[#8C7A6B] tracking-[0.2em] uppercase mt-1 truncate max-w-full">
            {shopName}
          </span>
        </div>
      )}

      {/* Collapse Toggle Button (Desktop Only) */}
      <div className="hidden lg:flex p-2 border-t border-[#281B12]">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-1.5 rounded-xl text-[#8C7A6B] hover:text-white hover:bg-[#251810] transition-colors text-xs font-medium gap-1.5"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {dir === "rtl" ? (
            sidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block transition-all duration-300 ease-in-out shrink-0 ${
          sidebarCollapsed ? "w-16" : "w-48"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Panel */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div
            className={`fixed inset-y-0 start-0 z-50 w-52 max-w-full shadow-2xl transition-transform duration-300`}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}