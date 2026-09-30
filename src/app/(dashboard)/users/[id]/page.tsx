"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  User as UserIcon,
  Shield,
  UserCheck,
  Calendar,
  Clock,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Banknote,
  Smartphone,
  Utensils,
  Package,
  Bike,
  Receipt,
  Edit2,
  FileText,
  DollarSign,
  Coffee,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { UserModal } from "@/features/users/UserModal";
import { Role, Status } from "@/types";
import { Pagination } from "@/components/common/Pagination";
import { useAuthStore } from "@/store/authStore";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { lang, t, dir } = useLangStore();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isGuest = currentUser?.role === "GUEST";

  const { data: user, isLoading, error } = useUser(id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const recentSales = user?.recentSales || [];
  const totalPages = Math.ceil(recentSales.length / pageSize) || 1;
  const paginatedSales = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return recentSales.slice(start, start + pageSize);
  }, [recentSales, page, pageSize]);

  const ArrowBack = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto space-y-6">
        <div className="h-8 w-44 bg-warmgray-200 dark:bg-warmgray-800 rounded-xl animate-pulse" />
        <div className="h-44 bg-warmgray-200 dark:bg-warmgray-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-warmgray-200 dark:bg-warmgray-800 rounded-3xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-warmgray-200 dark:bg-warmgray-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-warmgray-900 dark:text-white">
          User Not Found
        </h2>
        <p className="text-xs text-warmgray-500">
          The requested staff account could not be found or you may not have administrative access.
        </p>
        <Link
          href="/users"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md hover:bg-amber-700 transition"
        >
          <ArrowBack className="w-4 h-4" />
          <span>Back to Users</span>
        </Link>
      </div>
    );
  }

  const handleSaveUser = async (data: {
    name: string;
    email: string;
    role: Role;
    status?: Status;
    password?: string;
  }) => {
    if (isGuest) return;
    await api.patch(`/users/${id}`, {
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      ...(data.password ? { passwordPlain: data.password } : {}),
    });
    queryClient.invalidateQueries({ queryKey: ["user", id] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const { stats } = user;
  const isUserActive = user.status === "ACTIVE";

  // Calculate order type percentages
  const totalOrders = stats.totalSalesCount || 0;
  const dineInPct = totalOrders > 0 ? Math.round((stats.orderTypeBreakdown.DINE_IN / totalOrders) * 100) : 0;
  const takeawayPct = totalOrders > 0 ? Math.round((stats.orderTypeBreakdown.TAKEAWAY / totalOrders) * 100) : 0;
  const deliveryPct = totalOrders > 0 ? Math.round((stats.orderTypeBreakdown.DELIVERY / totalOrders) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-16">
      {/* Top Nav & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-xs font-bold text-warmgray-600 dark:text-warmgray-400 hover:text-amber-600 transition group"
        >
          <ArrowBack className="w-4 h-4 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
          <span>Back to All Users</span>
        </Link>

        {!isGuest && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 text-warmgray-700 dark:text-warmgray-200 hover:bg-warmgray-50 dark:hover:bg-warmgray-800 font-bold text-xs shadow-sm transition"
          >
            <Edit2 className="w-4 h-4 text-amber-600" />
            <span>Edit Account</span>
          </button>
        )}
      </div>

      {/* User Executive Profile Header Card */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-900/20 shrink-0">
            {getInitials(user.name)}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-xl ${
                  user.role === "ADMIN"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200/50"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/50"
                }`}
              >
                {user.role === "ADMIN" ? <Shield className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span>{user.role}</span>
              </span>

              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-xl ${
                  isUserActive
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                    : "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? "bg-emerald-500" : "bg-red-500"}`} />
                <span>{isUserActive ? "Active" : "Inactive"}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-warmgray-900 dark:text-white tracking-tight">
              {user.name}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-warmgray-600 dark:text-warmgray-400 mt-0.5">
              {user.email}
            </p>

            <div className="flex items-center gap-4 text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Highlights Pill */}
        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-s border-warmgray-100 dark:border-warmgray-800 pt-4 md:pt-0 md:ps-6 shrink-0">
          <p className="text-xs text-warmgray-700 dark:text-warmgray-400 font-bold uppercase tracking-wider">Total Contribution</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {stats.totalRevenue.toFixed(2)}{" "}
            <span className="text-sm font-semibold text-warmgray-600 dark:text-warmgray-400">SAR</span>
          </p>
          <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium mt-0.5">
            {stats.totalSalesCount} total invoices billed
          </p>
        </div>
      </div>

      {/* 4 Performance KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400">Total Revenue</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-warmgray-900 dark:text-white mt-2">
            {stats.totalRevenue.toFixed(2)}{" "}
            <span className="text-xs font-semibold text-warmgray-600 dark:text-warmgray-400">SAR</span>
          </p>
          <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium mt-1">
            Lifetime sales volume
          </p>
        </div>

        {/* Total Orders Handled */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400">Completed Orders</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-warmgray-900 dark:text-white mt-2">
            {stats.totalSalesCount}
          </p>
          <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium mt-1">
            Orders processed at counter
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400">Avg. Order Value (AOV)</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-warmgray-900 dark:text-white mt-2">
            {stats.avgOrderValue.toFixed(2)}{" "}
            <span className="text-xs font-semibold text-warmgray-600 dark:text-warmgray-400">SAR</span>
          </p>
          <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium mt-1">
            Per transaction average
          </p>
        </div>

        {/* Today's Performance */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400">Today's Sales</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {stats.todayRevenue.toFixed(2)}{" "}
            <span className="text-xs font-semibold text-warmgray-600 dark:text-warmgray-400">SAR</span>
          </p>
          <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium mt-1">
            {stats.todaySalesCount} orders served today
          </p>
        </div>
      </div>

      {/* Operational Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Type Distribution */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-warmgray-900 dark:text-white flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>Order Type Breakdown</span>
            </h2>
            <span className="text-xs text-warmgray-600 dark:text-warmgray-400 font-bold">{totalOrders} total</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Dine-In */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                <span className="flex items-center gap-1.5 text-warmgray-700 dark:text-warmgray-300">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  Dine-In
                </span>
                <span className="text-warmgray-900 dark:text-white font-bold">
                  {stats.orderTypeBreakdown.DINE_IN} orders ({dineInPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-warmgray-100 dark:bg-warmgray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${dineInPct}%` }}
                />
              </div>
            </div>

            {/* Takeaway */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                <span className="flex items-center gap-1.5 text-warmgray-700 dark:text-warmgray-300">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  Takeaway
                </span>
                <span className="text-warmgray-900 dark:text-white font-bold">
                  {stats.orderTypeBreakdown.TAKEAWAY} orders ({takeawayPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-warmgray-100 dark:bg-warmgray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${takeawayPct}%` }}
                />
              </div>
            </div>

            {/* Delivery */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                <span className="flex items-center gap-1.5 text-warmgray-700 dark:text-warmgray-300">
                  <Bike className="w-3.5 h-3.5 text-emerald-600" />
                  Delivery
                </span>
                <span className="text-warmgray-900 dark:text-white font-bold">
                  {stats.orderTypeBreakdown.DELIVERY} orders ({deliveryPct}%)
                </span>
              </div>
              <div className="w-full h-2 bg-warmgray-100 dark:bg-warmgray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${deliveryPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-warmgray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Payment Methods Taken</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {Object.entries(stats.paymentMethodBreakdown).map(([method, data]) => {
              let Icon = CreditCard;
              if (method === "CASH") Icon = Banknote;
              if (method === "MOBILE_PAY") Icon = Smartphone;

              return (
                <div
                  key={method}
                  className="p-3.5 bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-100 dark:border-warmgray-800 rounded-2xl flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 text-warmgray-700 dark:text-warmgray-300 text-xs font-bold">
                    <Icon className="w-4 h-4 text-amber-600" />
                    <span>{method}</span>
                  </div>
                  <div className="mt-3">
                    <p className="text-base font-black text-warmgray-900 dark:text-white">
                      {data.total.toFixed(0)} <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-medium">SAR</span>
                    </p>
                    <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium">
                      {data.count} transactions
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Sales History Table */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-warmgray-100 dark:border-warmgray-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-warmgray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-600" />
              <span>Recent Sales Invoices</span>
            </h2>
            <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-0.5">
              Showing recent transactions rung up by {user.name}
            </p>
          </div>

          <Link
            href="/orders"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 transition"
          >
            View All Store Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-warmgray-50 dark:bg-warmgray-950/80 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800 sticky top-0 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-5 text-start">Order ID</th>
                <th className="py-3.5 px-4 text-start">Invoice #</th>
                <th className="py-3.5 px-4 text-start">Date & Time</th>
                <th className="py-3.5 px-4 text-start">Customer</th>
                <th className="py-3.5 px-4 text-start">Order Type</th>
                <th className="py-3.5 px-4 text-start">Payment</th>
                <th className="py-3.5 px-4 text-start">Items</th>
                <th className="py-3.5 px-5 text-end">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800/80">
              {recentSales.length > 0 ? (
                paginatedSales.map((sale) => {
                  const orderId =
                    (sale as any).orderNumber ||
                    (sale.invoiceNumber
                      ? sale.invoiceNumber.replace("INV-", "ORD-")
                      : `ORD-${sale.id.slice(0, 6).toUpperCase()}`);

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-warmgray-50/70 dark:hover:bg-warmgray-800/40 transition"
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/orders/${sale.id}`}
                          className="font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                            {orderId}
                          </span>
                        </Link>
                      </td>

                      {/* Invoice */}
                      <td className="py-3.5 px-4 font-mono font-medium text-warmgray-600 dark:text-warmgray-400">
                        <span>{sale.invoiceNumber}</span>
                      </td>

                    {/* Date/Time */}
                    <td className="py-3.5 px-4 text-warmgray-600 dark:text-warmgray-300 font-medium">
                      {new Date(sale.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      {sale.customerName ? (
                        <div>
                          <p className="font-bold text-warmgray-900 dark:text-white leading-tight">
                            {sale.customerName}
                          </p>
                          {sale.customerPhone && (
                            <p className="text-[10px] text-warmgray-500 dark:text-warmgray-400 font-mono">
                              {sale.customerPhone}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-warmgray-500 dark:text-warmgray-400 text-[11px] italic">Walk-in Customer</span>
                      )}
                    </td>

                    {/* Order Type */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300">
                        {sale.orderType || "DINE_IN"}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {sale.paymentMethod}
                      </span>
                    </td>

                    {/* Items count */}
                    <td className="py-3.5 px-4 text-warmgray-700 dark:text-warmgray-300 font-bold">
                      {sale.itemsCount} items
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-5 text-end">
                      <span className="font-black text-sm text-warmgray-900 dark:text-white">
                        {sale.totalAmount.toFixed(2)}{" "}
                        <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-medium">SAR</span>
                      </span>
                    </td>
                  </tr>
                );
              })) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-warmgray-600 dark:text-warmgray-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-warmgray-400" />
                    <p className="font-semibold">No sales processed yet by this user.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {recentSales.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={recentSales.length}
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

      {/* Edit Modal */}
      <UserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveUser}
        editingUser={user}
      />
    </div>
  );
}
