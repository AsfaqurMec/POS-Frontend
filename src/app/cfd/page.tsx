"use client";

import React, { useState, useEffect } from "react";
import { Coffee, CheckCircle2, Sparkles, ShoppingBag, Clock, Maximize2, Minimize2 } from "lucide-react";
import { cfdChannel, CfdBroadcastMessage, CfdCartItem } from "@/lib/broadcast";
import { useBusiness } from "@/hooks/useQueries";
import { useDisplayMode } from "@/hooks/useDisplayMode";
import { getMediaUrl } from "@/lib/env";

export default function CustomerFacingDisplayPage() {
  const { data: business } = useBusiness();
  const [logoError, setLogoError] = useState(false);

  const [cartState, setCartState] = useState<{
    items: CfdCartItem[];
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    orderType: string;
  }>({
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    orderType: "TAKEAWAY",
  });

  const [completedSale, setCompletedSale] = useState<{
    orderNumber?: string;
    invoiceNumber: string;
    total: number;
    cashierName?: string;
  } | null>(null);

  const [currentTime, setCurrentTime] = useState("");

  const {
    isFullscreen,
    isStandalone,
    isSupported: isFullscreenSupported,
    toggleFullscreen,
    enterFullscreen,
  } = useDisplayMode();

  const handleDisplayClick = () => {
    if (!isFullscreen && !isStandalone && isFullscreenSupported) {
      enterFullscreen();
    }
  };

  // Ensure Customer Facing Display is ALWAYS in crisp, light theme
  useEffect(() => {
    const root = document.documentElement;
    const hasDark = root.classList.contains("dark");
    if (hasDark) {
      root.classList.remove("dark");
    }
    return () => {
      if (hasDark) {
        root.classList.add("dark");
      }
    };
  }, []);

  // Real-time digital clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize and persist cart state across page reloads
  useEffect(() => {
    // 1. Restore from localStorage if page was refreshed
    if (typeof window !== "undefined") {
      try {
        const savedState = localStorage.getItem("pos_cfd_cart_state");
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            setCartState({
              items: parsed.items || [],
              subtotal: parsed.subtotal || 0,
              discount: parsed.discount || 0,
              tax: parsed.tax || 0,
              total: parsed.total || 0,
              orderType: parsed.orderType || "TAKEAWAY",
            });
          }
        }
      } catch (err) {
        console.warn("Failed to restore CFD cart state:", err);
      }
    }

    // 2. Request live sync from cashier POS terminal
    cfdChannel.send({ type: "REQUEST_SYNC" });

    // 3. Listen for BroadcastChannel events
    const unsubscribe = cfdChannel.listen((msg: CfdBroadcastMessage) => {
      if (msg.type === "CART_UPDATE" && msg.payload) {
        const updated = {
          items: msg.payload.items || [],
          subtotal: msg.payload.subtotal || 0,
          discount: msg.payload.discount || 0,
          tax: msg.payload.tax || 0,
          total: msg.payload.total || 0,
          orderType: msg.payload.orderType || "TAKEAWAY",
        };
        setCartState(updated);
        setCompletedSale(null);

        if (typeof window !== "undefined") {
          try {
            if (updated.items.length > 0) {
              localStorage.setItem("pos_cfd_cart_state", JSON.stringify(updated));
            } else {
              localStorage.removeItem("pos_cfd_cart_state");
            }
          } catch (e) {
            // ignore
          }
        }
      } else if (msg.type === "SALE_SUCCESS" && msg.payload) {
        setCompletedSale({
          orderNumber:
            msg.payload.orderNumber ||
            msg.payload.invoiceNumber?.replace("INV-", "ORD-") ||
            "ORD-000",
          invoiceNumber: msg.payload.invoiceNumber || "",
          total: msg.payload.total || 0,
          cashierName: msg.payload.cashierName,
        });

        if (typeof window !== "undefined") {
          localStorage.removeItem("pos_cfd_cart_state");
        }

        // Auto reset to welcome screen after 8 seconds
        setTimeout(() => {
          setCompletedSale(null);
          setCartState({
            items: [],
            subtotal: 0,
            discount: 0,
            tax: 0,
            total: 0,
            orderType: "TAKEAWAY",
          });
        }, 8000);
      } else if (msg.type === "CART_CLEAR") {
        setCartState({
          items: [],
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
          orderType: "TAKEAWAY",
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem("pos_cfd_cart_state");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const currency = business?.currency || "SAR";
  const hasItems = cartState.items.length > 0;

  // Resolve business logo URL
  const logoUrl = business?.logoUrl ? getMediaUrl(business.logoUrl) : null;

  return (
    <div
      onClick={handleDisplayClick}
      className="min-h-screen bg-[#FDFBF7] text-[#231815] flex flex-col justify-between p-2 select-none font-sans overflow-hidden cursor-default"
    >
      {/* 1. Top Header Bar */}
      <header className="flex items-center justify-between bg-white border border-[#EADBCE] rounded-md px-4 py-2 shadow-xs">
        <div className="flex items-center gap-4">
          {/* Business Logo */}
          <div className="w-14 h-14 rounded-md bg-[#F7F2EA] border border-[#EADBCE] shadow-2xs flex items-center justify-center p-1.5 overflow-hidden shrink-0">
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt={business?.nameEn || "Logo"}
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-full h-full rounded-lg bg-amber-100/70 flex items-center justify-center text-amber-800">
                <Coffee className="w-7 h-7" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#231815] tracking-tight">
                {business?.nameEn || "MK COFFEE"}
              </h1>
              {business?.nameAr && (
                <span className="text-xs font-bold text-[#8A7160] hidden sm:inline">
                  • {business.nameAr}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.1">
              <span className="px-2.5 pt-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-bold tracking-wide uppercase">
                Customer Display
              </span>
              <span className="text-xs text-[#8A7160] font-semibold">
                • {cartState.orderType}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Clock & Fullscreen Control */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#F7F2EA] px-3 py-2 rounded-md border border-[#EADBCE]">
            <Clock className="w-4 h-4 text-amber-800 mr-1" />
            <span className="text-md font-black text-[#231815] font-mono tracking-wide">
              {currentTime}
            </span>
          </div>

          {isFullscreenSupported && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[#F7F2EA] hover:bg-[#EADBCE] text-amber-900 border border-[#EADBCE] text-xs font-bold transition active:scale-95 shadow-2xs"
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen (F11)"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-amber-800" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-amber-800" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Display Area */}
      <main className="flex-1 flex my-6 min-h-0">
        {completedSale ? (
          /* PAYMENT SUCCESS SCREEN */
          <div className="m-auto text-center space-y-5 max-w-lg bg-white border border-[#EADBCE] rounded-md p-8 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-24 h-24 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-14 h-14" />
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-black text-[#231815]">Thank You!</h2>
              <p className="text-lg font-bold text-amber-800">شكراً لزيارتكم</p>
              <p className="text-sm text-[#685346] pt-1">
                Your order is confirmed and being freshly prepared by our baristas.
              </p>
            </div>

            {/* Prominent Order Number Callout */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-600/30 text-center space-y-1">
              <span className="text-xs font-black text-amber-800 uppercase tracking-widest block">
                Your Order Number / رقم الطلب
              </span>
              <span className="text-4xl font-black text-[#231815] font-mono tracking-tight block">
                {completedSale.orderNumber || (completedSale.invoiceNumber ? completedSale.invoiceNumber.replace("INV-", "ORD-") : "ORD-001")}
              </span>
              <p className="text-xs text-[#8A7160] font-semibold pt-1">
                Please listen for your order number at the pickup counter
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#EADBCE] flex items-center justify-between text-xs">
              <div className="text-start">
                <span className="text-[10px] font-bold text-[#8A7160] uppercase tracking-wider block">
                  Invoice / رقم الفاتورة
                </span>
                <span className="font-bold text-[#231815] font-mono">
                  {completedSale.invoiceNumber}
                </span>
              </div>
              <div className="text-end">
                <span className="text-[10px] font-bold text-[#8A7160] uppercase tracking-wider block">
                  Amount Paid / المبلغ المدفوع
                </span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  {completedSale.total.toFixed(2)} {currency}
                </span>
              </div>
            </div>
          </div>
        ) : hasItems ? (
          /* ACTIVE SHOPPING CART SCREEN */
          <div className="w-full grid grid-cols-12 gap-6 items-start h-full">
            {/* Left Column: Items List (7 cols) */}
            <div className="col-span-7 bg-white border border-[#EADBCE] rounded-md p-6 shadow-md flex flex-col max-h-[72vh]">
              <div className="flex items-center justify-between border-b border-[#EADBCE] pb-3 text-xs font-bold text-[#8A7160] uppercase tracking-wider shrink-0">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-800" />
                  <span>Order Items ({cartState.items.reduce((s, i) => s + i.quantity, 0)})</span>
                </span>
                <span>Price</span>
              </div>

              <div className="space-y-3 divide-y divide-[#F0E8DF] overflow-y-auto pr-1 mt-2">
                {cartState.items.map((item, idx) => {
                  const itemImg = item.imageUrl ? getMediaUrl(item.imageUrl) : null;

                  const basePrice =
                    item.basePrice ??
                    (item.selectedOptions && item.selectedOptions.length > 0
                      ? item.unitPrice -
                        item.selectedOptions.reduce(
                          (sum, opt) => sum + (opt.priceAdjustment || 0),
                          0
                        )
                      : item.unitPrice);

                  return (
                    <div
                      key={item.id || idx}
                      className="pt-3 first:pt-0 flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Product Image Thumbnail */}
                        <div className="w-16 h-16 rounded-md bg-[#F7F2EA] border border-[#EADBCE] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs mt-0.5">
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={item.nameEn}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Coffee className="w-7 h-7 text-[#A25E1F]/50" />
                          )}
                        </div>

                        {/* Title & Customizations */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-[#2B1D16] text-amber-200 font-black text-xs shrink-0 shadow-2xs">
                              {item.quantity}x
                            </span>
                            <span className="font-bold text-base text-[#231815] truncate">
                              {item.nameEn}
                            </span>
                          </div>
                          {item.nameAr && item.nameAr !== item.nameEn && (
                            <p className="text-xs font-medium text-[#8A7160] ps-0.5 truncate">
                              {item.nameAr}
                            </p>
                          )}

                          {/* Base Price Display */}
                          <div className="text-xs text-[#8A7160] flex items-center gap-1.5 font-medium ps-0.5 pt-0.5">
                            <span>Base Price:</span>
                            <span className="font-bold text-[#231815] font-mono">
                              {currency} {basePrice.toFixed(2)}
                            </span>
                          </div>

                          {/* Add-on Prices */}
                          {item.selectedOptions && item.selectedOptions.length > 0 ? (
                            <div className="mt-1.5 space-y-1 ps-0.5">
                              {item.selectedOptions.map((opt, optIdx) => {
                                const optName =
                                  opt.optionNameEn +
                                  (opt.optionNameAr && opt.optionNameAr !== opt.optionNameEn
                                    ? ` • ${opt.optionNameAr}`
                                    : "");
                                return (
                                  <div
                                    key={optIdx}
                                    className="text-xs text-[#685346] flex items-center justify-between gap-2 bg-[#FAF7F2] px-2.5 py-1 rounded-md border border-[#EFE8DF]"
                                  >
                                    <span className="font-medium truncate">+ {optName}</span>
                                    <span className="font-bold text-amber-800 shrink-0 font-mono text-xs">
                                      {opt.priceAdjustment > 0
                                        ? `+${currency} ${opt.priceAdjustment.toFixed(2)}`
                                        : "0.00"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : item.optionsSummary ? (
                            <p className="text-xs text-[#A25E1F] font-medium ps-0.5 truncate">
                              {item.optionsSummary}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {/* Line Total */}
                      <div className="text-end shrink-0 pt-0.5">
                        <div className="flex items-baseline justify-end">
                          <span className="font-black text-lg text-[#231815] font-mono">
                            {item.lineTotal.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-[#8A7160] ms-1">
                            {currency}
                          </span>
                        </div>
                        {item.quantity > 1 && (
                          <span className="text-[11px] font-semibold text-[#8A7160] block font-mono">
                            ({item.unitPrice.toFixed(2)} {currency} ea)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Order Summary (5 cols) */}
            <div className="col-span-5 bg-gradient-to-b from-white to-[#FAF6F0] border border-[#EADBCE] rounded-md p-6 shadow-md space-y-5">
              <h3 className="text-base font-black text-[#231815] uppercase tracking-wider border-b border-[#EADBCE] pb-3">
                Order Summary / ملخص الطلب
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-[#685346] font-medium">
                  <span>Subtotal / المجموع الفرعي</span>
                  <span className="font-bold text-[#231815] font-mono text-base">
                    {cartState.subtotal.toFixed(2)} {currency}
                  </span>
                </div>

                {cartState.discount > 0 && (
                  <div className="flex justify-between items-center text-red-600 font-semibold">
                    <span>Discount / الخصم</span>
                    <span className="font-bold font-mono text-base">
                      -{cartState.discount.toFixed(2)} {currency}
                    </span>
                  </div>
                )}

                {cartState.tax > 0 && (
                  <div className="flex justify-between items-center text-[#685346] font-medium">
                    <span>VAT / ضريبة القيمة المضافة</span>
                    <span className="font-bold text-[#231815] font-mono text-base">
                      {cartState.tax.toFixed(2)} {currency}
                    </span>
                  </div>
                )}

                {/* Total Callout Banner */}
                <div className="mt-4 bg-[#2B1D16] rounded-md p-5 text-white shadow-lg flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
                    Total Amount Due / المبلغ المستحق
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-4xl font-black text-white tracking-tight font-mono">
                      {cartState.total.toFixed(2)}
                    </span>
                    <span className="text-xl font-bold text-amber-300">{currency}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-[#8A7160] font-semibold bg-[#F5EFE8] py-2.5 px-4 rounded-md border border-[#EADBCE]">
                Please tap your card or present payment to the cashier
              </div>
            </div>
          </div>
        ) : (
          /* IDLE / WELCOME SCREEN */
          <div className="m-auto text-center space-y-6 max-w-2xl bg-white  rounded-md p-10 shadow-md">
            <div className="w-28 h-28 rounded-md bg-[#F7F2EA] border border-[#EADBCE] flex items-center justify-center mx-auto text-amber-800 shadow-md p-2">
              {logoUrl && !logoError ? (
                <img
                  src={logoUrl}
                  alt={business?.nameEn || "Logo"}
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Coffee className="w-14 h-14" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-[#231815] tracking-tight">
                Welcome to {business?.nameEn || "Aroma Coffee"}
              </h2>
              {business?.nameAr && (
                <p className="text-xl font-bold text-amber-800">
                  أهلاً بكم في {business.nameAr}
                </p>
              )}
              <p className="text-base text-[#685346] font-medium pt-1">
                Artisan coffee, single-origin roasts, signature cold brews & fresh baked pastries.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FAF0E6] border border-[#ECD9C6] text-xs font-bold text-amber-900 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Ask our barista for today’s featured specialty espresso</span>
            </div>
          </div>
        )}
      </main>

      {/* 3. Footer Bar */}
      <footer className="border-t border-[#EADBCE] pt-3 text-center text-xs text-[#8A7160] font-medium">
        {business?.receiptFooterEn || "Thank you for visiting! Have a wonderful day."}
      </footer>

      {/* Tap to Fullscreen Reminder when in normal browser window */}
      {!isFullscreen && !isStandalone && isFullscreenSupported && (
        <div 
          onClick={handleDisplayClick}
          className="fixed bottom-4 start-1/2 -translate-x-1/2 z-50 bg-[#231815]/95 hover:bg-[#231815] text-amber-300 text-xs font-bold px-4 py-2 rounded-full shadow-2xl border border-amber-500/50 flex items-center gap-2 cursor-pointer transition active:scale-95 animate-pulse"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Tap anywhere to expand to Full Screen</span>
        </div>
      )}
    </div>
  );
}
