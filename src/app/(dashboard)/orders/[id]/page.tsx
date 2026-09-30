"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/env";
import { useLangStore } from "@/store/langStore";
import { usePosStore } from "@/store/posStore";
import { ReceiptModal } from "@/features/pos/ReceiptModal";
import {
  ArrowLeft,
  ArrowRight,
  Printer,
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  Banknote,
  MoreHorizontal,
  Coffee,
  CheckCircle2,
  Package,
  ShoppingBag,
} from "lucide-react";
import { Sale, SaleResponse } from "@/types";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { lang, t, dir } = useLangStore();
  const { openReceiptModal } = usePosStore();

  const [saleData, setSaleData] = useState<{ sale: Sale; business: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    api
      .get<{ sale: Sale; business: any }>(`/sales/${id}`)
      .then((data) => {
        setSaleData(data);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load order details");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    if (saleData && saleData.sale && saleData.sale.invoice) {
      const saleResponse: SaleResponse = {
        sale: saleData.sale,
        invoice: saleData.sale.invoice,
        business: saleData.business,
      };
      openReceiptModal(saleResponse);
    }
  };

  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-16">
        <div className="h-8 w-40 bg-warmgray-200 dark:bg-warmgray-800 rounded-xl animate-pulse" />
        <div className="h-48 bg-warmgray-200 dark:bg-warmgray-800 rounded-3xl animate-pulse" />
        <div className="h-96 bg-warmgray-200 dark:bg-warmgray-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !saleData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-warmgray-900 dark:text-white">
          {error || "Order not found"}
        </h2>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md hover:bg-amber-700 transition"
        >
          <BackArrow className="w-4 h-4" />
          <span>{t.orders.backToOrders}</span>
        </Link>
      </div>
    );
  }

  const { sale, business } = saleData;
  const invoice = sale.invoice;
  const cashierName = sale.user?.name || invoice?.cashierName || "Staff";
  const customerName = sale.customerName || invoice?.customerName || (lang === "ar" ? "عميل صالة" : "Walk-in Customer");
  const customerPhone = sale.customerPhone || invoice?.customerPhone || null;
  const isTakeaway = sale.orderType === "TAKEAWAY";
  const orderId =
    sale.orderNumber ||
    (invoice?.invoiceNumber
      ? invoice.invoiceNumber.replace("INV-", "ORD-")
      : `ORD-${sale.id.slice(0, 6).toUpperCase()}`);

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-16">
      <ReceiptModal />

      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2.5 rounded-xl bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-700 transition shadow-sm"
            title="Back to Orders"
          >
            <BackArrow className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-black text-xl tracking-wide">
                {orderId}
              </span>
              <h1 className="text-xl font-bold text-warmgray-900 dark:text-white tracking-tight">
                {invoice?.invoiceNumber ? `(${invoice.invoiceNumber})` : ""}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{sale.status}</span>
              </span>
            </div>
            <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-0.5">
              {t.orders.orderDetails}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-900/20 active:scale-95 transition"
        >
          <Printer className="w-4 h-4" />
          <span>{t.orders.printReceipt}</span>
        </button>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Order Info */}
        <div className="p-4 rounded-xl bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 shadow-sm space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-warmgray-700 dark:text-warmgray-400">
            {t.orders.orderType} & {t.orders.date}
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-warmgray-100 dark:border-warmgray-800">
              <span className="text-warmgray-600 dark:text-warmgray-400 font-medium">Order ID:</span>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                {orderId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-warmgray-600 dark:text-warmgray-400 font-medium">{t.orders.invoiceNo}:</span>
              <span className="font-mono font-semibold text-warmgray-800 dark:text-warmgray-200">
                {invoice?.invoiceNumber || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-warmgray-600 dark:text-warmgray-400 font-medium">{t.orders.orderType}:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-md ${
                  isTakeaway
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300"
                }`}
              >
                {isTakeaway ? t.pos.takeaway : t.pos.dineIn}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-warmgray-600 dark:text-warmgray-400 font-medium">{t.orders.date}:</span>
              <span className="font-semibold text-warmgray-800 dark:text-warmgray-200">
                {invoice ? `${invoice.issueDate} ${invoice.issueTime}` : new Date(sale.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-warmgray-600 dark:text-warmgray-400 font-medium">{t.orders.payment}:</span>
              <span className="inline-flex items-center gap-1 font-bold text-warmgray-800 dark:text-warmgray-200">
                {sale.paymentMethod === "CASH" ? (
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                ) : sale.paymentMethod === "CARD" ? (
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                ) : (
                  <MoreHorizontal className="w-3.5 h-3.5 text-purple-600" />
                )}
                <span>
                  {sale.paymentMethod === "CASH"
                    ? t.pos.cash
                    : sale.paymentMethod === "CARD"
                    ? t.pos.card
                    : t.pos.other}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Cashier / Order Creator */}
        <div className="p-4 rounded-xl bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 shadow-sm space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-warmgray-700 dark:text-warmgray-400">
            {t.orders.cashier} (Order Creator)
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                {cashierName[0]}
              </div>
              <div>
                <p className="font-bold text-sm text-warmgray-900 dark:text-white leading-tight">
                  {cashierName}
                </p>
                <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400">{sale.user?.email || "Terminal Staff"}</p>
              </div>
            </div>
            <div className="pt-1 border-t border-warmgray-100 dark:border-warmgray-800 text-[11px] text-warmgray-600 dark:text-warmgray-400">
              Role: <span className="font-semibold text-warmgray-800 dark:text-warmgray-200">{sale.user?.role || "Staff"}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Customer Details */}
        <div className="p-4 rounded-xl bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 shadow-sm space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-warmgray-700 dark:text-warmgray-400">
            {t.orders.customer}
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-warmgray-500 dark:text-warmgray-400" />
              <span className="font-bold text-warmgray-900 dark:text-white">
                {customerName}
              </span>
            </div>
            {customerPhone ? (
              <div className="flex items-center gap-2 text-warmgray-700 dark:text-warmgray-300">
                <Phone className="w-4 h-4 text-warmgray-500 dark:text-warmgray-400" />
                <span className="font-mono font-medium">{customerPhone}</span>
              </div>
            ) : (
              <p className="text-[11px] text-warmgray-500 dark:text-warmgray-400 italic">No phone number recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Itemized Products Card */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-warmgray-200 dark:border-warmgray-800 bg-warmgray-50/50 dark:bg-warmgray-800/40">
          <h2 className="font-bold text-sm text-warmgray-900 dark:text-white">
            {t.orders.items} ({sale.items?.length || 0})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-warmgray-50 dark:bg-warmgray-800/40 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800">
              <tr>
                <th className="py-3 px-4 text-start">Image</th>
                <th className="py-3 px-4 text-start">{t.pos.item}</th>
                <th className="py-3 px-4 text-start">{t.pos.price}</th>
                <th className="py-3 px-4 text-start">{t.pos.qty}</th>
                <th className="py-3 px-4 text-end">{t.pos.total}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800">
              {sale.items?.map((item) => {
                const name = lang === "ar" ? item.itemNameArSnapshot : item.itemNameEnSnapshot;
                const imageUrl = item.item?.imageUrl;

                return (
                  <tr key={item.id} className="hover:bg-warmgray-50/60 dark:hover:bg-warmgray-800/30">
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-xl bg-warmgray-100 dark:bg-warmgray-800 overflow-hidden flex items-center justify-center border border-warmgray-200 dark:border-warmgray-700">
                        {imageUrl ? (
                          <img
                            src={getMediaUrl(imageUrl)}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Coffee className="w-5 h-5 text-amber-600/70" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-base text-warmgray-900 dark:text-white">{name}</p>

                      {/* Base Price */}
                      <div className="text-xs text-warmgray-600 dark:text-warmgray-400 mt-0.5 flex items-center gap-1 font-medium">
                        <span>{t.pos.basePrice || "Base Price"}:</span>
                        <span className="font-semibold text-warmgray-800 dark:text-warmgray-200">
                          {item.baseUnitPrice.toFixed(2)} SAR
                        </span>
                      </div>

                      {/* Options / Modifiers */}
                      {item.options && item.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.options.map((opt, oIdx) => (
                            <span
                              key={oIdx}
                              className="text-[11px] bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-800/50 flex items-center gap-1 font-medium"
                            >
                              <span>+ {lang === "ar" ? opt.optionNameAr : opt.optionNameEn}</span>
                              <span className="font-bold text-amber-700 dark:text-amber-400 font-mono text-[10px]">
                                {opt.priceAdjustment > 0
                                  ? `(+${opt.priceAdjustment.toFixed(2)} SAR)`
                                  : "(0.00)"}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-warmgray-700 dark:text-warmgray-300">
                      <div className="font-bold text-base">
                        {item.unitPrice.toFixed(2)} SAR
                      </div>
                      {item.options && item.options.length > 0 && item.variationAmount > 0 && (
                        <div className="text-[10px] text-warmgray-500 dark:text-warmgray-400 font-mono">
                          ({item.baseUnitPrice.toFixed(2)} + {item.variationAmount.toFixed(2)})
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-lg font-bold text-warmgray-900 dark:text-white">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-end font-bold text-amber-600 dark:text-amber-400 text-lg">
                      {item.lineTotal.toFixed(2)} SAR
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="p-5 border-t border-warmgray-200 dark:border-warmgray-800 bg-warmgray-50/50 dark:bg-warmgray-800/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">
            {(lang === "ar" ? business?.nameAr || business?.nameEn : business?.nameEn || business?.nameAr) || ""} — {lang === "ar" ? `جميع الأسعار بـ ${t.common.sar || "ر.س"}` : `All prices in ${t.common.sar || "SAR"}`}
          </div>
          <div className="w-full sm:w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-warmgray-700 dark:text-warmgray-300 font-medium">
              <span>{t.pos.subtotal}</span>
              <span className="font-semibold text-warmgray-900 dark:text-white">
                {sale.subtotal.toFixed(2)} SAR
              </span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>{t.pos.discount} ({sale.discountType})</span>
                <span className="font-semibold">-{sale.discountAmount.toFixed(2)} SAR</span>
              </div>
            )}
            {sale.taxAmount > 0 && (
              <div className="flex justify-between text-warmgray-700 dark:text-warmgray-300 font-medium">
                <span>{t.pos.tax}</span>
                <span className="font-semibold">{sale.taxAmount.toFixed(2)} SAR</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-warmgray-900 dark:text-white pt-2 border-t border-warmgray-200 dark:border-warmgray-700">
              <span>{t.pos.total}</span>
              <span className="text-amber-600 dark:text-amber-400">
                {sale.totalAmount.toFixed(2)} SAR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
