"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSales, useVoidSale } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { usePosStore } from "@/store/posStore";
import { usePinStore } from "@/store/pinStore";
import { ReceiptModal } from "@/features/pos/ReceiptModal";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Receipt,
  Search,
  Printer,
  Eye,
  CreditCard,
  Banknote,
  MoreHorizontal,
  RotateCcw,
  Calendar,
  ArrowUpDown,
  UtensilsCrossed,
  ShoppingBag,
  TrendingUp,
  X,
  Truck,
  Ban,
} from "lucide-react";
import { SaleResponse } from "@/types";
import { Pagination } from "@/components/common/Pagination";

export default function OrdersPage() {
  const { lang, t } = useLangStore();
  const { openReceiptModal } = usePosStore();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  // Calculate start & end date based on date preset
  const dateRange = useMemo(() => {
    const now = new Date();
    if (dateFilter === "TODAY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: new Date().toISOString() };
    }
    if (dateFilter === "YESTERDAY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (dateFilter === "LAST_7_DAYS") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: new Date().toISOString() };
    }
    if (dateFilter === "THIS_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString(), endDate: new Date().toISOString() };
    }
    return { startDate: undefined, endDate: undefined };
  }, [dateFilter]);

  const { data, isLoading } = useSales(page, pageSize, {
    search: searchTerm.trim() || undefined,
    orderType: orderTypeFilter !== "ALL" ? orderTypeFilter : undefined,
    paymentMethod: paymentFilter !== "ALL" ? paymentFilter : undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    sortBy,
  });

  const sales = data?.sales || [];
  const totalCount = data?.total || 0;

  // Stats computed from loaded sales & total
  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const dineInCount = sales.filter((s) => s.orderType === "DINE_IN").length;
    const takeawayCount = sales.filter((s) => s.orderType === "TAKEAWAY").length;
    const cashCount = sales.filter((s) => s.paymentMethod === "CASH").length;
    const cardCount = sales.filter((s) => s.paymentMethod === "CARD").length;

    return {
      totalRevenue,
      dineInCount,
      takeawayCount,
      cashCount,
      cardCount,
    };
  }, [sales]);

  const isFiltered =
    searchTerm.trim() !== "" ||
    orderTypeFilter !== "ALL" ||
    paymentFilter !== "ALL" ||
    dateFilter !== "ALL" ||
    sortBy !== "NEWEST";

  const handleResetFilters = () => {
    setSearchTerm("");
    setOrderTypeFilter("ALL");
    setPaymentFilter("ALL");
    setDateFilter("ALL");
    setSortBy("NEWEST");
    setPage(1);
  };

  const handleViewReceipt = async (saleId: string) => {
    try {
      const res = await api.get<{ sale: any; business: any }>(`/sales/${saleId}`);
      if (res && res.sale && res.sale.invoice) {
        const saleResponse: SaleResponse = {
          sale: res.sale,
          invoice: res.sale.invoice,
          business: res.business,
        };
        openReceiptModal(saleResponse);
      }
    } catch (err: any) {
      alert("Failed to load invoice receipt: " + err.message);
    }
  };

  const voidSaleMutation = useVoidSale();
  const { requestManagerApproval } = usePinStore();

  const handleVoidSale = (saleId: string) => {
    if (isGuest) return;
    requestManagerApproval("Authorize Order Void & Stock Refund", () => {
      const reason = window.prompt("Reason for voiding order:", "Customer Refund / Order Cancelled");
      if (!reason) return;
      voidSaleMutation.mutate({ saleId, voidReason: reason, restock: true });
    });
  };


  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full mb-20">
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-warmgray-900 dark:text-white tracking-tight">
            {t.orders.title}
          </h1>
          <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-1">
            {t.orders.subtitle}
          </p>
        </div>

        {/* Quick Reset if Active */}
        {isFiltered && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.common.clear || "Reset Filters"}</span>
          </button>
        )}
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-300">
              {t.orders.totalOrders || "Total Orders"}
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-warmgray-900 dark:text-white">
              {totalCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-medium">orders</span>
          </div>
        </div>

        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-300">
              Page Revenue
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.totalRevenue.toFixed(2)}
            </span>
            <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-bold">SAR</span>
          </div>
        </div>

        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-300">
              Dine In / Takeaway
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-warmgray-900 dark:text-white">
              {stats.dineInCount} <span className="text-xs text-warmgray-500 font-medium">in</span> · {stats.takeawayCount} <span className="text-xs text-warmgray-500 font-medium">out</span>
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-300">
              Payment Split
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-warmgray-900 dark:text-white">
              {stats.cardCount} <span className="text-xs text-warmgray-500 font-medium">Card</span> · {stats.cashCount} <span className="text-xs text-warmgray-500 font-medium">Cash</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Filter & Search Toolbar */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Top Filter Row: Search Input + Order Type Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-500 dark:text-warmgray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder={t.orders.searchOrders || "Search by Order ID, Invoice #, Customer, Phone, or Cashier..."}
              className="w-full ps-10 pe-9 py-2 bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl text-xs font-medium text-warmgray-900 dark:text-white placeholder:text-warmgray-500 dark:placeholder:text-warmgray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setPage(1);
                }}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-0.5 text-warmgray-400 hover:text-warmgray-700 dark:hover:text-warmgray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Order Type Segmented Pills */}
          <div className="flex items-center p-1 bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl shrink-0 overflow-x-auto">
            <button
              onClick={() => {
                setOrderTypeFilter("ALL");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                orderTypeFilter === "ALL"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-warmgray-700 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => {
                setOrderTypeFilter("DINE_IN");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                orderTypeFilter === "DINE_IN"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-warmgray-700 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
              }`}
            >
              <UtensilsCrossed className="w-3 h-3" />
              <span>{t.pos.dineIn || "Dine In"}</span>
            </button>
            <button
              onClick={() => {
                setOrderTypeFilter("TAKEAWAY");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                orderTypeFilter === "TAKEAWAY"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-warmgray-700 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              <span>{t.pos.takeaway || "Take Away"}</span>
            </button>
            <button
              onClick={() => {
                setOrderTypeFilter("DELIVERY");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                orderTypeFilter === "DELIVERY"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-warmgray-700 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
              }`}
            >
              <Truck className="w-3 h-3" />
              <span>{t.pos.delivery || "Delivery"}</span>
            </button>
          </div>
        </div>

        {/* Bottom Filter Row: Payment Method, Date Range, Sort By */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-warmgray-100 dark:border-warmgray-800">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Payment Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-warmgray-700 dark:text-warmgray-400 font-bold">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl px-2.5 py-1.5 font-bold text-xs text-warmgray-800 dark:text-warmgray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Payments</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other / Mobile Pay</option>
              </select>
            </div>

            {/* Date Range Preset Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-warmgray-500 dark:text-warmgray-400" />
              <span className="text-warmgray-700 dark:text-warmgray-400 font-bold">Date:</span>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl px-2.5 py-1.5 font-bold text-xs text-warmgray-800 dark:text-warmgray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="THIS_MONTH">This Month</option>
              </select>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-xs ms-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-warmgray-500 dark:text-warmgray-400" />
            <span className="text-warmgray-700 dark:text-warmgray-400 font-bold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl px-2.5 py-1.5 font-bold text-xs text-warmgray-800 dark:text-warmgray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="AMOUNT_DESC">Highest Total</option>
              <option value="AMOUNT_ASC">Lowest Total</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Orders Table Container */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-warmgray-50 dark:bg-warmgray-800/60 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800 sticky top-0">
              <tr>
                <th className="py-3.5 px-4 text-start">Order ID</th>
                <th className="py-3.5 px-4 text-start">{t.orders.invoiceNo}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.date}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.orderType}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.cashier}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.customer}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.items}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.payment}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.total}</th>
                <th className="py-3.5 px-4 text-end">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={10} className="py-4 px-4">
                      <div className="h-5 bg-warmgray-100 dark:bg-warmgray-800 rounded" />
                    </td>
                  </tr>
                ))
              ) : sales.length > 0 ? (
                sales.map((sale) => {
                  const orderId =
                    sale.orderNumber ||
                    (sale.invoice?.invoiceNumber
                      ? sale.invoice.invoiceNumber.replace("INV-", "ORD-")
                      : `ORD-${sale.id.slice(0, 6).toUpperCase()}`);
                  const invoiceNo = sale.invoice?.invoiceNumber || "N/A";
                  const cashierName = sale.user?.name || sale.invoice?.cashierName || "Staff";
                  const customerName = sale.customerName || sale.invoice?.customerName;
                  const customerPhone = sale.customerPhone || sale.invoice?.customerPhone;
                  const orderType = sale.orderType || sale.invoice?.orderType || "TAKEAWAY";
                  const itemCount = sale.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                  const dateStr = sale.invoice
                    ? `${sale.invoice.issueDate} ${sale.invoice.issueTime}`
                    : new Date(sale.createdAt).toLocaleString();

                  const isVoided = (sale as any).status === "VOIDED";

                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-warmgray-50/80 dark:hover:bg-warmgray-800/40 transition ${
                        isVoided ? "opacity-75 bg-red-50/30 dark:bg-red-950/10" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/orders/${sale.id}`}
                          className="font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center"
                        >
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs">
                            {orderId}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-warmgray-700 dark:text-warmgray-300">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{invoiceNo}</span>
                          {isVoided && (
                            <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                              VOIDED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-warmgray-600 dark:text-warmgray-300 font-medium">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            orderType === "DINE_IN"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                              : orderType === "DELIVERY"
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {orderType === "DINE_IN"
                            ? t.pos.dineIn
                            : orderType === "DELIVERY"
                            ? t.pos.delivery || "Delivery"
                            : t.pos.takeaway}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-warmgray-800 dark:text-warmgray-200">
                        {cashierName}
                      </td>
                      <td className="py-3 px-4">
                        {customerName ? (
                          <div>
                            <p className="font-semibold text-warmgray-900 dark:text-white">
                              {customerName}
                            </p>
                            {customerPhone && (
                              <p className="text-[10px] text-warmgray-500 dark:text-warmgray-400 font-mono">
                                {customerPhone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-warmgray-500 dark:text-warmgray-400 italic text-[11px]">Walk-in</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-warmgray-700 dark:text-warmgray-300 font-medium">
                        {itemCount} {itemCount === 1 ? t.pos.item : t.orders.items}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-warmgray-700 dark:text-warmgray-300">
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
                      </td>
                      <td className="py-3 px-4 font-bold text-warmgray-900 dark:text-white">
                        <span className={isVoided ? "line-through text-red-500/70" : ""}>
                          {sale.totalAmount.toFixed(2)} {t.common.sar}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/orders/${sale.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 transition"
                            title={t.orders.viewOrder}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.orders.viewOrder}</span>
                          </Link>
                          <button
                            onClick={() => handleViewReceipt(sale.id)}
                            className="inline-flex items-center p-1.5 rounded-lg text-xs font-bold bg-warmgray-100 hover:bg-warmgray-200 text-warmgray-700 dark:bg-warmgray-800 dark:text-warmgray-300 transition"
                            title={t.orders.printReceipt}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {!isVoided && !isGuest && (
                            <button
                              onClick={() => handleVoidSale(sale.id)}
                              disabled={voidSaleMutation.isPending}
                              className="inline-flex items-center p-1.5 rounded-lg text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 transition"
                              title="Void & Refund (Manager PIN Required)"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-warmgray-600 dark:text-warmgray-400">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-warmgray-400" />
                    <p className="font-bold text-sm text-warmgray-700 dark:text-warmgray-300">{t.orders.noOrders}</p>
                    <p className="text-xs text-warmgray-500 dark:text-warmgray-400 mt-1">
                      {isFiltered ? "No orders matched your filter criteria. Try resetting filters." : "Completed POS checkout orders will appear here"}
                    </p>
                    {isFiltered && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 rounded-xl hover:bg-amber-100 transition"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Unified Pagination Controls */}
        {totalCount > 0 && (
          <Pagination
            currentPage={page}
            totalItems={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[10, 15, 25, 50]}
          />
        )}
      </div>

      <ReceiptModal />
    </div>
  );
}