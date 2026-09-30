"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCartStore } from "@/store/cartStore";
import { useLangStore } from "@/store/langStore";
import { usePosStore } from "@/store/posStore";
import { useAuthStore } from "@/store/authStore";
import { useBusiness, useHoldOrder, useHeldOrders } from "@/hooks/useQueries";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/env";
import { cfdChannel } from "@/lib/broadcast";
import { kickCashDrawer } from "@/lib/escpos";
import { offlineSync } from "@/lib/offlineSync";
import { HeldOrdersModal } from "@/components/modals/HeldOrdersModal";
import { SplitPaymentModal } from "@/components/modals/SplitPaymentModal";
import {
  CreditCard,
  Banknote,
  Smartphone,
  GitFork,
  Star,
  MoreHorizontal,
  Trash2,
  Plus,
  Minus,
  Tag,
  ShoppingBag,
  Coffee,
  User as UserIcon,
  X,
  ArrowRight,
  ChevronLeft,
  Clock,
  Layers,
  Split,
} from "lucide-react";
import { CartItem, DiscountType, PaymentMethod, SaleResponse, SplitPayment } from "@/types";

export function CartPanel() {
  const {
    items,
    discountType,
    discountValue,
    paymentMethod,
    orderType,
    customerName,
    customerPhone,
    isSubmitting,
    updateCartItemQuantity,
    removeFromCart,
    setDiscount,
    setPaymentMethod,
    setOrderType,
    setCustomerInfo,
    setIsSubmitting,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTotalAmount,
  } = useCartStore();

  const { openVariationModal, openReceiptModal } = usePosStore();
  const { lang, t, dir } = useLangStore();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";
  const { data: business } = useBusiness();
  const { data: heldOrders } = useHeldOrders();
  const holdOrderMutation = useHoldOrder();
  const queryClient = useQueryClient();

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [tempDiscountType, setTempDiscountType] = useState<DiscountType>(discountType);
  const [tempDiscountValue, setTempDiscountValue] = useState<number>(discountValue);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [showCustomerInput, setShowCustomerInput] = useState(false);

  // New enterprise modal states
  const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [pagerTag, setPagerTag] = useState("");

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const total = getTotalAmount(
    business?.taxEnabled,
    business?.taxRate,
    business?.pricingMode
  );

  const taxAmount = business?.taxEnabled
    ? business.pricingMode === "EXCLUSIVE"
      ? (subtotal - discountAmount) * ((business.taxRate || 15) / 100)
      : (subtotal - discountAmount) -
        (subtotal - discountAmount) / (1 + (business.taxRate || 15) / 100)
    : 0;

  // Broadcast cart changes live to CFD and sync with localStorage
  useEffect(() => {
    if (items.length === 0) {
      cfdChannel.send({ type: "CART_CLEAR" });
      if (typeof window !== "undefined") {
        localStorage.removeItem("pos_cfd_cart_state");
      }
      return;
    }

    const payload = {
      items: items.map((i) => ({
        id: i.cartItemId,
        nameEn: i.item.nameEn,
        nameAr: i.item.nameAr,
        imageUrl: i.item.imageUrl || null,
        quantity: i.quantity,
        basePrice: i.baseUnitPrice ?? (i.variant?.price ?? i.item.basePrice),
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        optionsSummary: i.selectedOptions.map((o) => o.optionNameEn).join(", "),
        selectedOptions: i.selectedOptions.map((o) => ({
          groupId: o.groupId,
          groupNameEn: o.groupNameEn,
          groupNameAr: o.groupNameAr,
          optionId: o.optionId,
          optionNameEn: o.optionNameEn,
          optionNameAr: o.optionNameAr,
          priceAdjustment: o.priceAdjustment,
        })),
      })),
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      currency: business?.currency || "SAR",
      orderType,
    };

    cfdChannel.send({
      type: "CART_UPDATE",
      payload,
    });

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pos_cfd_cart_state", JSON.stringify(payload));
      } catch (e) {
        console.warn("Failed to persist CFD cart state:", e);
      }
    }
  }, [items, subtotal, discountAmount, taxAmount, total, business?.currency, orderType]);

  // Respond to CFD REQUEST_SYNC handshakes
  useEffect(() => {
    const unsub = cfdChannel.listen((msg) => {
      if (msg.type === "REQUEST_SYNC") {
        if (items.length > 0) {
          const payload = {
            items: items.map((i) => ({
              id: i.cartItemId,
              nameEn: i.item.nameEn,
              nameAr: i.item.nameAr,
              imageUrl: i.item.imageUrl || null,
              quantity: i.quantity,
              basePrice: i.baseUnitPrice ?? (i.variant?.price ?? i.item.basePrice),
              unitPrice: i.unitPrice,
              lineTotal: i.lineTotal,
              optionsSummary: i.selectedOptions.map((o) => o.optionNameEn).join(", "),
              selectedOptions: i.selectedOptions.map((o) => ({
                groupId: o.groupId,
                groupNameEn: o.groupNameEn,
                groupNameAr: o.groupNameAr,
                optionId: o.optionId,
                optionNameEn: o.optionNameEn,
                optionNameAr: o.optionNameAr,
                priceAdjustment: o.priceAdjustment,
              })),
            })),
            subtotal,
            discount: discountAmount,
            tax: taxAmount,
            total,
            currency: business?.currency || "SAR",
            orderType,
          };
          cfdChannel.send({
            type: "CART_UPDATE",
            payload,
          });
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("pos_cfd_cart_state", JSON.stringify(payload));
            } catch (e) {
              console.warn("Failed to persist CFD cart state:", e);
            }
          }
        } else {
          cfdChannel.send({ type: "CART_CLEAR" });
          if (typeof window !== "undefined") {
            localStorage.removeItem("pos_cfd_cart_state");
          }
        }
      }
    });

    return () => unsub();
  }, [items, subtotal, discountAmount, taxAmount, total, business?.currency, orderType]);

  const handleEditItem = (cartItem: CartItem) => {
    openVariationModal(cartItem.item, cartItem);
  };

  const handleApplyDiscount = () => {
    setDiscount(tempDiscountType, tempDiscountValue);
    setIsDiscountModalOpen(false);
  };

  const handleHoldOrder = async () => {
    if (items.length === 0 || isHolding || isGuest) return;
    setIsHolding(true);
    try {
      const snapshot = JSON.stringify({
        items,
        discountType,
        discountValue,
        orderType,
      });

      await holdOrderMutation.mutateAsync({
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        tag: pagerTag.trim() || undefined,
        orderType,
        cartSnapshot: snapshot,
        itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        subtotal,
      });

      clearCart();
      setPagerTag("");
    } catch (err: any) {
      setSaleError(err?.message || "Failed to hold order");
    } finally {
      setIsHolding(false);
    }
  };

  const handleCompleteSale = async (splitPayments?: SplitPayment[]) => {
    if (items.length === 0 || isSubmitting || isGuest) return;

    if (paymentMethod === "SPLIT" && (!splitPayments || splitPayments.length === 0)) {
      setIsSplitModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setSaleError(null);

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    try {
      const payload: any = {
        items: items.map((i) => ({
          itemId: i.item.id,
          variantId: i.variant?.id || null,
          quantity: i.quantity,
          selectedOptionIds: i.selectedOptions.map((o) => o.optionId),
        })),
        discountType,
        discountValue,
        paymentMethod: splitPayments ? "SPLIT" : paymentMethod,
        orderType,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        tag: pagerTag.trim() || undefined,
      };

      if (splitPayments && splitPayments.length > 0) {
        payload.payments = splitPayments;
      }

      let result: any;

      if (isOffline) {
        const offId = offlineSync.queueSale(payload, total);
        result = {
          sale: {
            id: offId,
            orderNumber: `ORD-${offId.slice(0, 6).toUpperCase()}`,
            totalAmount: total,
            paymentMethod: payload.paymentMethod,
            orderType,
            status: "COMPLETED (OFFLINE)",
            createdAt: new Date().toISOString(),
          },
          invoice: {
            id: offId,
            invoiceNumber: offId,
            cashierName: "Offline Register",
            issueDate: new Date().toISOString().split("T")[0],
            issueTime: new Date().toLocaleTimeString(),
            subtotal,
            discount: discountAmount,
            tax: taxAmount,
            totalAmount: total,
            paymentMethod: payload.paymentMethod,
          },
          business: {
            nameEn: business?.nameEn || "Aroma Coffee",
            nameAr: business?.nameAr || "مقهى أروما",
            currency: business?.currency || "SAR",
          },
        };
      } else {
        result = await api.post<SaleResponse>("/sales", payload);
      }

      // Kick drawer if cash payment
      if (
        paymentMethod === "CASH" ||
        (splitPayments && splitPayments.some((p) => p.paymentMethod === "CASH"))
      ) {
        kickCashDrawer();
      }

      // Broadcast success to CFD
      const orderNum =
        result.sale?.orderNumber ||
        result.invoice?.invoiceNumber?.replace("INV-", "ORD-") ||
        "ORD-000";

      cfdChannel.send({
        type: "SALE_SUCCESS",
        payload: {
          orderNumber: orderNum,
          invoiceNumber: result.invoice?.invoiceNumber || "INV-000",
          total: result.sale?.totalAmount || total,
          cashierName: result.invoice?.cashierName,
          paymentMethod: payload.paymentMethod,
        },
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("pos_cfd_cart_state");
        try {
          localStorage.setItem(
            "pos_cfd_last_sale",
            JSON.stringify({
              orderNumber: orderNum,
              invoiceNumber: result.invoice?.invoiceNumber || "INV-000",
              total: result.sale?.totalAmount || total,
              cashierName: result.invoice?.cashierName,
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          // ignore
        }
      }

      // Invalidate and refetch queries so stock levels and orders update immediately in real time
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["items"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["sales"] }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["current-shift"] }),
      ]);

      clearCart();
      setIsSplitModalOpen(false);
      openReceiptModal(result);
    } catch (err: any) {
      const errMsg =
        err?.message ||
        err?.error?.message ||
        "Failed to process sale. Please check inventory.";
      setSaleError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentButtons = [
    { id: "CASH" as PaymentMethod, label: t.pos.cash || "Cash", icon: Banknote },
    { id: "CARD" as PaymentMethod, label: t.pos.card || "Card", icon: CreditCard },
    { id: "SPLIT" as PaymentMethod, label: "Split Tender", icon: Split },
    { id: "OTHER" as PaymentMethod, label: t.pos.others || "Others", icon: MoreHorizontal },
  ];

  const ArrowIcon = dir === "rtl" ? ChevronLeft : ArrowRight;

  return (
    <div className="w-full lg:w-[380px] xl:w-[410px] 2xl:w-[410px] bg-white dark:bg-[#1E140E] rounded-xl border border-[#E8DFD7] dark:border-[#382418] flex flex-col h-full shrink-0 shadow-sm p-4 overflow-hidden select-none">
      {/* 1. Panel Header: Current Order + Park/Recall + Clear Button */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE4] dark:border-[#2D1D14] shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black text-[#1C140E] dark:text-white">
            {t.pos.currentOrder || "Current Order"}
          </h2>
          <button
            type="button"
            onClick={() => setIsHeldModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold transition border border-amber-500/20"
            title="View Parked / Held Orders"
          >
            <Clock className="w-3 h-3" />
            <span>Held ({heldOrders?.length || 0})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {items.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleHoldOrder}
                disabled={isHolding || isGuest}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold transition border border-amber-200 dark:border-amber-800/60 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isGuest ? "Action not allowed in Guest Mode" : "Hold / Park this order (F4)"}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isHolding ? "Holding..." : "Hold"}</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(t.pos.clearCartConfirm || "Are you sure you want to clear the current order?")) {
                    clearCart();
                  }
                }}
                className="p-1.5 rounded-lg text-warmgray-500 hover:text-red-600 transition"
                title="Clear Cart"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Order Type Segmented Pills: Dine In | Take Away | Delivery */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F5EFE6] dark:bg-[#281A12] rounded-2xl my-3 shrink-0">
        <button
          type="button"
          onClick={() => setOrderType("DINE_IN")}
          className={`py-2 text-xs font-bold rounded-xl transition ${
            orderType === "DINE_IN"
              ? "bg-[#2B1D16] dark:bg-amber-600 text-white shadow-sm"
              : "text-[#6E5448] dark:text-warmgray-400 hover:text-[#2B1D16] dark:hover:text-white"
          }`}
        >
          {t.pos.dineIn || "Dine In"}
        </button>

        <button
          type="button"
          onClick={() => setOrderType("TAKEAWAY")}
          className={`py-2 text-xs font-bold rounded-xl transition ${
            orderType === "TAKEAWAY"
              ? "bg-[#2B1D16] dark:bg-amber-600 text-white shadow-sm"
              : "text-[#6E5448] dark:text-warmgray-400 hover:text-[#2B1D16] dark:hover:text-white"
          }`}
        >
          {t.pos.takeaway || "Take Away"}
        </button>

        <button
          type="button"
          onClick={() => setOrderType("DELIVERY")}
          className={`py-2 text-xs font-bold rounded-xl transition ${
            orderType === "DELIVERY"
              ? "bg-[#2B1D16] dark:bg-amber-600 text-white shadow-sm"
              : "text-[#6E5448] dark:text-warmgray-400 hover:text-[#2B1D16] dark:hover:text-white"
          }`}
        >
          {t.pos.delivery || "Delivery"}
        </button>
      </div>

      {/* 3. Customer Info Section */}
      <div className="mb-2 shrink-0">
        {!showCustomerInput ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-[#FAF7F2] dark:bg-[#251810] border border-[#E8DFD7] dark:border-[#382418] hover:border-amber-600/40 transition">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-[#2B1D16] dark:bg-amber-600 text-amber-200 dark:text-white flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                {customerName ? (
                  <div>
                    <span className="text-xs font-bold text-[#231815] dark:text-white truncate block">
                      {customerName}
                    </span>
                    {customerPhone && (
                      <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 block font-mono font-medium">
                        {customerPhone}
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300 block">
                      {t.pos.customerDetails || "Customer Information"}
                    </span>
                    <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-medium block">
                      Optional · Name & Phone
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {customerName && (
                <button
                  type="button"
                  onClick={() => setCustomerInfo("", "")}
                  className="p-1 rounded-lg text-warmgray-500 hover:text-red-600 dark:text-warmgray-400 transition"
                  title="Clear Customer Info"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowCustomerInput(true)}
                className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#2B1D16] hover:bg-[#3D271D] dark:bg-amber-600 dark:hover:bg-amber-500 rounded-xl transition shadow-2xs"
              >
                {customerName
                  ? lang === "ar"
                    ? "تعديل"
                    : "Edit"
                  : lang === "ar"
                  ? "+ إضافة"
                  : "+ Add"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#251810] border border-[#D4A373] dark:border-amber-600 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#E8DFD7] dark:border-[#382418]">
              <span className="text-xs font-bold text-[#231815] dark:text-white flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-amber-800 dark:text-amber-400" />
                {t.pos.customerDetails || "Customer Information"}
              </span>
              <button
                type="button"
                onClick={() => setShowCustomerInput(false)}
                className="text-xs font-bold text-warmgray-500 hover:text-[#231815] dark:hover:text-white p-0.5"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-warmgray-700 dark:text-warmgray-300 uppercase tracking-wider mb-1 block">
                  {t.pos.customerName || "Customer Name"}
                </label>
                <input
                  type="text"
                  placeholder={lang === "ar" ? "مثال: عبدالله" : "e.g. Abdullah"}
                  value={customerName}
                  onChange={(e) => setCustomerInfo(e.target.value, customerPhone)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1E140E] border border-[#E8DFD7] dark:border-[#382418] rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 font-semibold text-[#231815] dark:text-white placeholder:text-warmgray-500 dark:placeholder:text-warmgray-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-warmgray-700 dark:text-warmgray-300 uppercase tracking-wider mb-1 block">
                  {t.pos.customerPhone || "Phone Number"}
                </label>
                <input
                  type="tel"
                  placeholder={lang === "ar" ? "مثال: 0501234567" : "e.g. 0501234567"}
                  value={customerPhone}
                  onChange={(e) => setCustomerInfo(customerName, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#1E140E] border border-[#E8DFD7] dark:border-[#382418] rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-600 font-semibold text-[#231815] dark:text-white placeholder:text-warmgray-500 dark:placeholder:text-warmgray-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              {customerName || customerPhone ? (
                <button
                  type="button"
                  onClick={() => {
                    setCustomerInfo("", "");
                  }}
                  className="text-[11px] font-bold text-red-600 hover:underline"
                >
                  {t.common.clear || "Clear"}
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setShowCustomerInput(false)}
                className="px-3.5 py-1 bg-[#2B1D16] hover:bg-[#3D271D] dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow-2xs"
              >
                {t.common.save || "Done"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Table Header: Item | Qty | Price */}
      <div className="grid grid-cols-12 text-[11px] font-bold text-warmgray-700 dark:text-warmgray-300 uppercase tracking-wider py-1.5 border-b border-[#F0EAE4] dark:border-[#2D1D14] px-1 shrink-0">
        <div className="col-span-6">{t.pos.item || "Item"}</div>
        <div className="col-span-3 text-center">{t.pos.qty || "Qty"}</div>
        <div className="col-span-3 text-end">{t.pos.price || "Price"}</div>
      </div>

      {/* 5. Cart Items Table List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 py-1 divide-y divide-[#F5EFE6] dark:divide-[#2D1D14]">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-warmgray-600 dark:text-warmgray-400">
            <ShoppingBag className="w-12 h-12 mb-2 opacity-30 stroke-[1.5]" />
            <p className="font-bold text-sm text-[#5C3E2E] dark:text-warmgray-200">
              {t.pos.emptyCartTitle || "No items in order"}
            </p>
            <p className="text-xs text-warmgray-600 dark:text-warmgray-400 mt-0.5 font-medium">
              {t.pos.emptyCartDesc || "Click items from the menu to add"}
            </p>
          </div>
        ) : (
          items.map((cartItem) => {
            const name = lang === "ar" ? cartItem.item.nameAr : cartItem.item.nameEn;
            const basePrice = cartItem.baseUnitPrice ?? (cartItem.variant?.price ?? cartItem.item.basePrice);
            const hasOptions = cartItem.selectedOptions.length > 0;

            return (
              <div
                key={cartItem.cartItemId}
                className="grid grid-cols-12 items-start py-2.5 px-1 hover:bg-[#FAF7F2]/60 dark:hover:bg-[#251810]/60 rounded-xl transition"
              >
                {/* Item Column: Thumbnail + Title + Base Price + Add-on Prices */}
                <div className="col-span-6 flex items-start gap-2 min-w-0 pr-1">
                  <div
                    onClick={() => handleEditItem(cartItem)}
                    className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-[#F5EFE6] dark:bg-[#281A12] border border-[#E8DFD7] dark:border-[#382418] cursor-pointer flex items-center justify-center shadow-2xs hover:opacity-90 transition mt-0.5"
                  >
                    {cartItem.item.imageUrl ? (
                      <img
                        src={getMediaUrl(cartItem.item.imageUrl)}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Coffee className="w-5 h-5 text-amber-800 dark:text-amber-400" />
                    )}
                  </div>
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => handleEditItem(cartItem)}
                    title="Click to edit item"
                  >
                    <h4 className="font-bold text-xs text-[#231815] dark:text-white truncate leading-tight hover:text-amber-800 dark:hover:text-amber-300 transition">
                      {name}
                    </h4>

                    {/* Base Price Display */}
                    <div className="text-[10px] text-warmgray-700 dark:text-warmgray-400 mt-0.5 flex items-center gap-1 font-medium">
                      <span>{t.pos.basePrice || "Base"}:</span>
                      <span className="font-semibold text-warmgray-800 dark:text-amber-300">
                        SAR {basePrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Add-ons with individual prices */}
                    {hasOptions && (
                      <div className="mt-1 space-y-0.5">
                        {cartItem.selectedOptions.map((o, optIdx) => {
                          const optName = lang === "ar" ? o.optionNameAr : o.optionNameEn;
                          return (
                            <div
                              key={optIdx}
                              className="text-[10px] text-warmgray-700 dark:text-warmgray-300 flex items-center justify-between gap-1 leading-tight bg-[#FAF7F2] dark:bg-[#251810] px-1.5 py-0.5 rounded border border-[#EFE8DF] dark:border-[#382418]"
                            >
                              <span className="truncate">+ {optName}</span>
                              <span className="font-bold text-amber-800 dark:text-amber-400 shrink-0 font-mono text-[9px]">
                                {o.priceAdjustment > 0
                                  ? `+SAR ${o.priceAdjustment.toFixed(2)}`
                                  : "0.00"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Qty Column: Stepper Pill [ - ] [ 1 ] [ + ] */}
                <div className="col-span-3 flex items-center justify-center pt-1">
                  <div className="flex items-center border border-[#E0D7CE] dark:border-[#382418] rounded-lg bg-[#FAF7F2] dark:bg-[#251810] px-1 py-0.5">
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(cartItem.cartItemId, -1)}
                      className="w-4 h-4 flex items-center justify-center text-warmgray-700 dark:text-warmgray-400 hover:text-[#2B1D16] dark:hover:text-white transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-[#231815] dark:text-white">
                      {cartItem.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(cartItem.cartItemId, 1)}
                      className="w-4 h-4 flex items-center justify-center text-warmgray-700 dark:text-warmgray-400 hover:text-[#2B1D16] dark:hover:text-white transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Price Column: SAR 12.00 + Unit Price (if qty > 1) + Remove × */}
                <div className="col-span-3 flex flex-col items-end justify-start gap-0.5 pt-1">
                  <div className="flex items-center justify-end gap-1.5 w-full">
                    <span className="font-bold text-xs text-[#231815] dark:text-amber-300 whitespace-nowrap">
                      SAR {cartItem.lineTotal.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(cartItem.cartItemId)}
                      className="text-warmgray-500 hover:text-red-600 transition p-0.5"
                      title="Remove item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {cartItem.quantity > 1 && (
                    <span className="text-[9px] text-warmgray-600 dark:text-warmgray-400 font-mono">
                      (SAR {cartItem.unitPrice.toFixed(2)} {t.pos.each || "ea"})
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sale Error Message */}
      {saleError && (
        <div className="p-2 mb-2 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-xs shrink-0">
          {saleError}
        </div>
      )}

      {/* 6. Financial Summary */}
      <div className="pt-3 border-t border-[#F0EAE4] dark:border-[#2D1D14] space-y-1 shrink-0">
        <div className="flex justify-between text-xs text-warmgray-700 dark:text-warmgray-300 font-medium">
          <span>{t.pos.subtotal || "Subtotal"}</span>
          <span className="font-bold text-[#231815] dark:text-warmgray-200">
            SAR {subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-xs text-warmgray-700 dark:text-warmgray-300 font-medium">
          <span>
            {t.pos.tax || "VAT"} ({business?.taxRate || 15}%)
          </span>
          <span className="font-bold text-[#231815] dark:text-warmgray-200">
            SAR {taxAmount.toFixed(2)}
          </span>
        </div>

        {/* Discount Row */}
        <div className="flex justify-between items-center text-xs text-warmgray-700 dark:text-warmgray-300 font-medium">
          <button
            type="button"
            onClick={() => {
              setTempDiscountType(discountType);
              setTempDiscountValue(discountValue);
              setIsDiscountModalOpen(true);
            }}
            className="flex items-center gap-1 text-amber-800 dark:text-amber-400 hover:underline font-semibold"
          >
            <Tag className="w-3 h-3" />
            <span>
              {discountAmount > 0
                ? `${t.pos.discount} (${
                    discountType === "PERCENTAGE" ? `${discountValue}%` : "Fixed"
                  })`
                : t.pos.applyDiscount || "Apply Discount"}
            </span>
          </button>
          <span className="font-bold text-red-600 dark:text-red-400">
            {discountAmount > 0 ? `-SAR ${discountAmount.toFixed(2)}` : "SAR 0.00"}
          </span>
        </div>

        {/* Total Row */}
        <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-[#F0EAE4] dark:border-[#2D1D14]">
          <span className="text-lg font-bold text-[#1C140E] dark:text-white">
            {t.pos.total || "Total"}
          </span>
          <span className="text-2xl font-black text-[#1C140E] dark:text-amber-300">
            SAR {total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* 7. Payment Method Grid */}
      <div className="grid grid-cols-4 gap-1.5 my-3 shrink-0">
        {paymentButtons.map((btn) => {
          const isSelected = paymentMethod === btn.id;
          const Icon = btn.icon;

          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => {
                setPaymentMethod(btn.id);
                if (btn.id === "SPLIT") {
                  setIsSplitModalOpen(true);
                }
              }}
              className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                isSelected
                  ? "border-2 border-[#2B1D16] dark:border-amber-500 bg-[#FAF7F2] dark:bg-[#251810] text-[#2B1D16] dark:text-amber-200 shadow-xs"
                  : "border border-[#E8DFD7] dark:border-[#382418] bg-white dark:bg-[#1E140E] text-[#6E5448] dark:text-warmgray-300 hover:border-amber-600/40 hover:bg-[#FAF7F2]/50 dark:hover:bg-[#251810]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate w-full text-center">{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* 8. Complete Payment Button */}
      <button
        type="button"
        onClick={() => handleCompleteSale()}
        disabled={items.length === 0 || isSubmitting || isGuest}
        className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-between shrink-0 ${
          items.length > 0 && !isSubmitting && !isGuest
            ? "bg-[#2B1D16] hover:bg-[#3D271D] dark:bg-amber-600 dark:hover:bg-amber-500 text-white active:scale-[0.99] cursor-pointer"
            : "bg-[#A69485]/40 text-white/80 cursor-not-allowed shadow-none"
        }`}
      >
        {isSubmitting ? (
          <div className="w-full flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{t.pos.processingSale || "Processing..."}</span>
          </div>
        ) : isGuest ? (
          <div className="w-full text-center text-xs tracking-wider uppercase font-bold text-amber-900 dark:text-amber-200">
            Guest Mode (View Only)
          </div>
        ) : (
          <>
            <CreditCard className="w-4 h-4 text-amber-200" />
            <span className="text-sm font-bold tracking-wide">
              {t.pos.completeSale || "Complete Payment"}
            </span>
            <ArrowIcon className="w-4 h-4 text-amber-200" />
          </>
        )}
      </button>

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E140E] rounded-xl max-w-xs w-full p-5 shadow-2xl border border-[#E8DFD7] dark:border-[#382418] space-y-4">
            <h3 className="font-bold text-base text-[#1C140E] dark:text-white">
              {t.pos.applyDiscount || "Apply Discount"}
            </h3>

            {/* Discount Type Radio */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTempDiscountType("PERCENTAGE")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  tempDiscountType === "PERCENTAGE"
                    ? "bg-[#2B1D16] dark:bg-amber-600 text-white border-[#2B1D16] dark:border-amber-600"
                    : "border-[#E8DFD7] dark:border-[#382418] text-[#6E5448] dark:text-warmgray-300"
                }`}
              >
                {t.pos.percentage || "Percentage (%)"}
              </button>
              <button
                type="button"
                onClick={() => setTempDiscountType("FIXED")}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  tempDiscountType === "FIXED"
                    ? "bg-[#2B1D16] dark:bg-amber-600 text-white border-[#2B1D16] dark:border-amber-600"
                    : "border-[#E8DFD7] dark:border-[#382418] text-[#6E5448] dark:text-warmgray-300"
                }`}
              >
                {t.pos.fixedAmount || "Fixed (SAR)"}
              </button>
            </div>

            {/* Value input */}
            <div>
              <label className="text-xs font-medium text-[#7A695E] dark:text-warmgray-400">
                {t.pos.discountValue || "Discount Value"}
              </label>
              <input
                type="number"
                min="0"
                max={tempDiscountType === "PERCENTAGE" ? 100 : subtotal}
                value={tempDiscountValue || ""}
                onChange={(e) => setTempDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 px-3 py-2 bg-[#FAF7F2] dark:bg-[#251810] border border-[#E8DFD7] dark:border-[#382418] rounded-xl text-sm font-bold text-[#231815] dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDiscount("NONE", 0);
                  setIsDiscountModalOpen(false);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#F5EFE6] dark:bg-[#281A12] hover:bg-[#E8DFD7] dark:hover:bg-[#322015] text-[#6E5448] dark:text-warmgray-300 transition"
              >
                {t.common.clear || "Clear"}
              </button>
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#2B1D16] hover:bg-[#3D271D] dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-sm transition"
              >
                {t.common.save || "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held / Parked Orders Modal */}
      <HeldOrdersModal
        isOpen={isHeldModalOpen}
        onClose={() => setIsHeldModalOpen(false)}
      />

      {/* Split Payment Tender Modal */}
      <SplitPaymentModal
        isOpen={isSplitModalOpen}
        totalDue={total}
        currency={business?.currency || "SAR"}
        onConfirm={(splits) => handleCompleteSale(splits)}
        onClose={() => setIsSplitModalOpen(false)}
      />
    </div>
  );
}