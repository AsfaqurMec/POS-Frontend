"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  Store,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Coffee,
  ChevronRight,
  BarChart3,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useDashboardStats, useBusiness } from "@/hooks/useQueries";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";
import { getMediaUrl } from "@/lib/env";

type PeriodType = "today" | "yesterday" | "7days" | "30days" | "this_month" | "this_year";

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const { lang, t } = useLangStore();
  const { data: business } = useBusiness();

  const [period, setPeriod] = useState<PeriodType>("7days");
  const [activeChartMetric, setActiveChartMetric] = useState<"revenue" | "orders" | "units">("revenue");

  const { data, isLoading, isRefetching, refetch } = useDashboardStats(period);

  const kpis = data?.kpis;
  const currency = business?.currency || "SAR";

  const periodOptions: { key: PeriodType; label: string; labelAr: string }[] = [
    { key: "today", label: "Today", labelAr: "اليوم" },
    { key: "yesterday", label: "Yesterday", labelAr: "أمس" },
    { key: "7days", label: "Last 7 Days", labelAr: "آخر 7 أيام" },
    { key: "30days", label: "Last 30 Days", labelAr: "آخر 30 يوماً" },
    { key: "this_month", label: "This Month", labelAr: "هذا الشهر" },
    { key: "this_year", label: "This Year", labelAr: "هذا العام" },
  ];

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return lang === "ar" ? "صباح الخير" : "Good morning";
    if (hour < 18) return lang === "ar" ? "مساء الخير" : "Good afternoon";
    return lang === "ar" ? "مساء الخير" : "Good evening";
  }, [lang]);

  // Formatter for currency
  const formatCurrency = (val: number = 0) => {
    return `${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  };

  // Custom Recharts Tooltip
  const CustomCurveTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-[#1C120C] text-warmgray-100 p-3.5 rounded-xl border border-amber-500/30 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
          <p className="font-bold text-amber-200 border-b border-[#2C1E14] pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between gap-3 text-emerald-400">
            <span className="font-medium text-warmgray-400">Revenue:</span>
            <span className="font-bold">{formatCurrency(dataPoint.revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-amber-400">
            <span className="font-medium text-warmgray-400">Orders:</span>
            <span className="font-bold">{dataPoint.orders} completed</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-cyan-400">
            <span className="font-medium text-warmgray-400">Items Sold:</span>
            <span className="font-bold">{dataPoint.units} units</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 pb-8">
      {/* 1. Header Bar with Period Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {business?.nameEn || "Aroma POS"} • Executive Portal
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-warmgray-900 dark:text-white tracking-tight mt-0.5">
            {greeting}, {user?.name || "Admin"}
          </h1>
          <p className="text-xs sm:text-sm text-warmgray-600 dark:text-warmgray-400 font-medium">
            Real-time business intelligence, sales analytics, stock velocity & operations
          </p>
        </div>

        {/* Date Filter & Refresh Button */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="inline-flex p-1 bg-warmgray-100 dark:bg-warmgray-800 rounded-xl border border-warmgray-200 dark:border-warmgray-700/80">
            {periodOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  period === opt.key
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-warmgray-600 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
                }`}
              >
                {lang === "ar" ? opt.labelAr : opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 bg-warmgray-100 dark:bg-warmgray-800 hover:bg-warmgray-200 dark:hover:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-200 rounded-xl transition border border-warmgray-200 dark:border-warmgray-700/80"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin text-amber-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Sales / Revenue */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-warmgray-900 dark:text-white tracking-tight">
              {isLoading ? "..." : (kpis?.totalRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-bold text-warmgray-500 ms-1.5">{currency}</span>
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                (kpis?.revenueGrowth ?? 0) >= 0
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
              }`}
            >
              {(kpis?.revenueGrowth ?? 0) >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {Math.abs(kpis?.revenueGrowth ?? 0)}%
            </span>
            <span className="text-warmgray-500 dark:text-warmgray-400 text-[11px]">vs previous period</span>
          </div>
        </div>

        {/* KPI 2: Total Orders & Average Order Value */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-warmgray-900 dark:text-white tracking-tight">
              {isLoading ? "..." : (kpis?.totalOrders || 0).toLocaleString()}
              <span className="text-xs font-bold text-warmgray-500 ms-1.5">orders</span>
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium border-t border-warmgray-100 dark:border-warmgray-800 pt-2.5">
            <span className="text-warmgray-500 dark:text-warmgray-400">Avg. Order Value (AOV):</span>
            <span className="font-bold text-warmgray-800 dark:text-warmgray-200">
              {kpis?.averageOrderValue || 0} {currency}
            </span>
          </div>
        </div>

        {/* KPI 3: Total Stock Valuation */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400 uppercase tracking-wider">
              Stock Valuation
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {isLoading ? "..." : (kpis?.totalStockValuation || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-bold text-warmgray-500 ms-1.5">{currency}</span>
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium border-t border-warmgray-100 dark:border-warmgray-800 pt-2.5">
            <span className="text-warmgray-500 dark:text-warmgray-400">Units in Stock:</span>
            <span className="font-bold text-warmgray-800 dark:text-warmgray-200">
              {(kpis?.totalUnitsInStock || 0).toLocaleString()} units
            </span>
          </div>
        </div>

        {/* KPI 4: Inventory Health Alerts */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400 uppercase tracking-wider">
              Stock Health
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-2xl font-black text-red-600 dark:text-red-400">
                {kpis?.outOfStockCount || 0}
              </span>
              <span className="text-[11px] font-bold text-warmgray-500">out of stock</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {kpis?.lowStockCount || 0}
              </span>
              <span className="text-[11px] font-bold text-warmgray-500">low</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium border-t border-warmgray-100 dark:border-warmgray-800 pt-2.5">
            <Link
              href="/inventory"
              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1"
            >
              <span>Manage Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/stock-movements"
              className="text-warmgray-500 hover:text-warmgray-800 dark:hover:text-warmgray-200 text-[11px]"
            >
              Audit Ledger
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Main Curve Graph (Sales & Revenue Curves) */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-lg font-black text-warmgray-900 dark:text-white">
                Revenue & Sales Curves
              </h2>
            </div>
            <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-0.5">
              Continuous performance curves across selected timeframe
            </p>
          </div>

          {/* Metric Selector Toggle */}
          <div className="flex items-center gap-1.5 bg-warmgray-100 dark:bg-warmgray-800 p-1 rounded-xl border border-warmgray-200 dark:border-warmgray-700 self-start sm:self-auto">
            <button
              onClick={() => setActiveChartMetric("revenue")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeChartMetric === "revenue"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-warmgray-600 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
              }`}
            >
              Revenue ({currency})
            </button>
            <button
              onClick={() => setActiveChartMetric("orders")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeChartMetric === "orders"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-warmgray-600 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
              }`}
            >
              Orders Volume
            </button>
            <button
              onClick={() => setActiveChartMetric("units")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeChartMetric === "units"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-warmgray-600 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
              }`}
            >
              Items Sold
            </button>
          </div>
        </div>

        {/* Recharts Curved Area Graph */}
        <div className="w-full h-72 sm:h-80">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data?.salesCurves || []}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D97706" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="unitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB", opacity: 0.3 }}
                  tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB", opacity: 0.3 }}
                  tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 600 }}
                />
                <Tooltip content={<CustomCurveTooltip />} />

                {activeChartMetric === "revenue" && (
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#D97706"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    dot={{ r: 3, fill: "#D97706" }}
                    activeDot={{ r: 6, fill: "#F59E0B", stroke: "#FFF", strokeWidth: 2 }}
                  />
                )}

                {activeChartMetric === "orders" && (
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#ordersGradient)"
                    dot={{ r: 3, fill: "#3B82F6" }}
                    activeDot={{ r: 6, fill: "#60A5FA", stroke: "#FFF", strokeWidth: 2 }}
                  />
                )}

                {activeChartMetric === "units" && (
                  <Area
                    type="monotone"
                    dataKey="units"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#unitsGradient)"
                    dot={{ r: 3, fill: "#10B981" }}
                    activeDot={{ r: 6, fill: "#34D399", stroke: "#FFF", strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Peak Hours Bar Chart & Operations Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peak Hours Hourly Heatmap / Distribution (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-base font-black text-warmgray-900 dark:text-white">
                  Peak Sales Hours (Rush Hours)
                </h3>
                <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">
                  Order frequency by hour of the day (00:00 to 23:00)
                </p>
              </div>
            </div>
          </div>

          <div className="w-full h-56 sm:h-64">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.hourlyDistribution || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                  <XAxis
                    dataKey="hour"
                    tickLine={false}
                    axisLine={{ stroke: "#E5E7EB", opacity: 0.3 }}
                    tick={{ fill: "#9CA3AF", fontSize: 10 }}
                    interval={2}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#E5E7EB", opacity: 0.3 }}
                    tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} orders`, "Orders Volume"]}
                    contentStyle={{
                      backgroundColor: "#1C120C",
                      borderColor: "#F59E0B33",
                      borderRadius: "12px",
                      color: "#FFF",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Methods & Order Types (1 Column) */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-black text-warmgray-900 dark:text-white">
                Payment Breakdown
              </h3>
            </div>

            <div className="space-y-3">
              {(data?.paymentBreakdown || []).map((pm) => (
                <div key={pm.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-warmgray-700 dark:text-warmgray-300 flex items-center gap-1.5">
                      {pm.method === "CASH" ? <Banknote className="w-3.5 h-3.5 text-emerald-500" /> : <CreditCard className="w-3.5 h-3.5 text-blue-500" />}
                      {pm.method}
                    </span>
                    <span className="text-warmgray-900 dark:text-white">
                      {formatCurrency(pm.total)} ({pm.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-warmgray-100 dark:bg-warmgray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pm.method === "CASH" ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(100, pm.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!data?.paymentBreakdown || data.paymentBreakdown.length === 0) && (
                <p className="text-xs text-warmgray-400 text-center py-4">No payment data recorded in this period</p>
              )}
            </div>
          </div>

          <div className="border-t border-warmgray-100 dark:border-warmgray-800 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <UtensilsCrossed className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-warmgray-900 dark:text-white">
                Order Type Share
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(data?.orderTypeBreakdown || []).map((ot) => (
                <div key={ot.type} className="p-3 rounded-xl bg-warmgray-50 dark:bg-warmgray-800/60 border border-warmgray-100 dark:border-warmgray-700/50">
                  <p className="text-[10px] font-bold text-warmgray-500 uppercase">{ot.type.replace("_", " ")}</p>
                  <p className="text-base font-black text-warmgray-900 dark:text-white mt-0.5">{ot.count} orders</p>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">{ot.percentage.toFixed(0)}% of total</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Top 10 Best-Selling Products Leaderboard */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-lg font-black text-warmgray-900 dark:text-white">
                Top Best-Selling Products Leaderboard
              </h3>
              <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">
                Ranked by revenue contribution & units sold
              </p>
            </div>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
          >
            <span>Full Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-warmgray-50 dark:bg-warmgray-950/80 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 text-start">Rank</th>
                <th className="py-3 px-4 text-start">Product</th>
                <th className="py-3 px-4 text-start">Category</th>
                <th className="py-3 px-4 text-start">Units Sold</th>
                <th className="py-3 px-4 text-start">Revenue Generated</th>
                <th className="py-3 px-4 text-start">Catalog Share</th>
                <th className="py-3 px-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800/80">
              {(data?.topSellingProducts || []).map((prod) => {
                const prodName = lang === "ar" ? prod.nameAr : prod.nameEn;
                const prodSub = lang === "ar" ? prod.nameEn : prod.nameAr;
                return (
                  <tr key={prod.itemId} className="hover:bg-warmgray-50/70 dark:hover:bg-warmgray-800/40 transition">
                    <td className="py-3 px-4">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-black text-xs ${
                          prod.rank === 1
                            ? "bg-amber-500 text-white shadow-sm"
                            : prod.rank === 2
                            ? "bg-warmgray-400 text-white"
                            : prod.rank === 3
                            ? "bg-amber-800 text-white"
                            : "bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300"
                        }`}
                      >
                        {prod.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-warmgray-100 dark:bg-warmgray-800 flex items-center justify-center overflow-hidden border border-warmgray-200 dark:border-warmgray-700 shrink-0">
                          {prod.imageUrl ? (
                            <img
                              src={getMediaUrl(prod.imageUrl)}
                              alt={prodName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Coffee className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/products/${prod.itemId}`}
                            className="font-bold text-warmgray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition"
                          >
                            {prodName}
                          </Link>
                          {prodSub && <p className="text-[10px] text-warmgray-500 font-medium">{prodSub}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-warmgray-600 dark:text-warmgray-300">
                      {lang === "ar" ? prod.categoryNameAr : prod.categoryNameEn}
                    </td>
                    <td className="py-3 px-4 font-black text-warmgray-900 dark:text-white">
                      {prod.unitsSold.toLocaleString()} units
                    </td>
                    <td className="py-3 px-4 font-black text-amber-600 dark:text-amber-400">
                      {formatCurrency(prod.revenue)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-warmgray-100 dark:bg-warmgray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${Math.min(100, prod.share)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-warmgray-600 dark:text-warmgray-400">
                          {prod.share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <Link
                        href={`/products/${prod.itemId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-warmgray-100 hover:bg-warmgray-200 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Movements</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!data?.topSellingProducts || data.topSellingProducts.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-warmgray-400">
                    No products sold in this period yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5.5 Recent Orders Table with Order IDs */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-warmgray-100 dark:border-warmgray-800 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-base font-black text-warmgray-900 dark:text-white">
                {lang === "ar" ? "الطلبات الأخيرة ونقاط البيع" : "Recent Live Orders"}
              </h3>
              <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">
                {lang === "ar"
                  ? "سجل أحدث العمليات بأرقام الطلبات الفريدة"
                  : "Latest transactions with verified Order IDs and payment breakdown"}
              </p>
            </div>
          </div>
          <Link
            href="/orders"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 group"
          >
            <span>{lang === "ar" ? "عرض جميع الطلبات" : "View All Orders"}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-warmgray-50 dark:bg-warmgray-800/60 text-warmgray-600 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800">
              <tr>
                <th className="py-3 px-4 text-start">Order ID</th>
                <th className="py-3 px-4 text-start">Invoice #</th>
                <th className="py-3 px-4 text-start">Date & Time</th>
                <th className="py-3 px-4 text-start">Customer</th>
                <th className="py-3 px-4 text-start">Type</th>
                <th className="py-3 px-4 text-start">Cashier</th>
                <th className="py-3 px-4 text-start">Payment</th>
                <th className="py-3 px-4 text-start">Total</th>
                <th className="py-3 px-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800">
              {(data?.recentActivity?.sales || []).map((sale: any) => {
                const orderId =
                  sale.orderNumber ||
                  (sale.invoiceNumber
                    ? sale.invoiceNumber.replace("INV-", "ORD-")
                    : `ORD-${sale.id.slice(0, 6).toUpperCase()}`);
                return (
                  <tr
                    key={sale.id}
                    className="hover:bg-warmgray-50/70 dark:hover:bg-warmgray-800/40 transition"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/orders/${sale.id}`}
                        className="inline-flex items-center gap-1 font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/70 hover:underline"
                      >
                        <span>{orderId}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-warmgray-500 font-semibold">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-warmgray-600 dark:text-warmgray-300 font-medium whitespace-nowrap">
                      {new Date(sale.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-warmgray-900 dark:text-white">
                      {sale.customerName || "Walk-in Guest"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          sale.orderType === "DINE_IN"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {sale.orderType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-warmgray-700 dark:text-warmgray-300 font-medium">
                      {sale.cashierName || "Staff"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-warmgray-700 dark:text-warmgray-300 flex items-center gap-1 text-[11px]">
                        {sale.paymentMethod === "CASH" ? (
                          <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                        )}
                        <span>{sale.paymentMethod}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-warmgray-900 dark:text-white font-mono">
                      {sale.totalAmount.toFixed(2)} {currency}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <Link
                        href={`/orders/${sale.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-warmgray-100 hover:bg-warmgray-200 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!data?.recentActivity?.sales || data.recentActivity.sales.length === 0) && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-warmgray-400">
                    No recent orders placed in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Dual Feeds: Critical Stock Alerts & Recent Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Critical Stock Alerts */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-black text-warmgray-900 dark:text-white">
                Urgent Stock Alerts
              </h3>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
            >
              <span>Restock Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {(data?.criticalStockAlerts || []).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 rounded-xl bg-warmgray-50 dark:bg-warmgray-800/60 border border-warmgray-100 dark:border-warmgray-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warmgray-200 dark:bg-warmgray-700 flex items-center justify-center shrink-0">
                    <Coffee className="w-4 h-4 text-warmgray-500" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-warmgray-900 dark:text-white">
                      {lang === "ar" ? alert.nameAr : alert.nameEn}
                    </p>
                    <p className="text-[10px] text-warmgray-500">{alert.categoryName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                      alert.status === "OUT_OF_STOCK"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}
                  >
                    {alert.stockQuantity} in stock
                  </span>
                  <Link
                    href={`/products/${alert.id}`}
                    className="p-1.5 rounded-lg text-warmgray-500 hover:text-warmgray-900 dark:hover:text-white hover:bg-warmgray-200 dark:hover:bg-warmgray-700 transition"
                    title="View Product"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
            {(!data?.criticalStockAlerts || data.criticalStockAlerts.length === 0) && (
              <div className="py-8 text-center text-warmgray-400 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                <p className="font-bold text-xs text-warmgray-700 dark:text-warmgray-300">All Stock Levels Healthy</p>
                <p className="text-[11px] text-warmgray-500">No items are currently out of stock or low</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Stock Movements Live Audit */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-base font-black text-warmgray-900 dark:text-white">
                Live Stock Movement Feed
              </h3>
            </div>
            <Link
              href="/stock-movements"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
            >
              <span>View All Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {(data?.recentActivity?.stockMovements || []).map((sm) => {
              const itemName = lang === "ar" ? sm.item?.nameAr : sm.item?.nameEn;
              const isPositive = sm.quantity > 0;
              return (
                <div
                  key={sm.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-warmgray-50 dark:bg-warmgray-800/60 border border-warmgray-100 dark:border-warmgray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                        sm.type === "SALE"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : sm.type === "RESTOCK"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : sm.type === "DAMAGE"
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                      }`}
                    >
                      {sm.type[0]}
                    </span>
                    <div>
                      <p className="font-bold text-xs text-warmgray-900 dark:text-white">
                        {itemName || "Product"}
                      </p>
                      <p className="text-[10px] text-warmgray-500">
                        {sm.reason || sm.type} • {sm.user?.name || "System"}
                      </p>
                    </div>
                  </div>

                  <div className="text-end">
                    <span
                      className={`font-black text-xs ${
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isPositive ? `+${sm.quantity}` : sm.quantity} units
                    </span>
                    <p className="text-[10px] text-warmgray-500 font-mono">
                      {sm.previousStock} → {sm.newStock}
                    </p>
                  </div>
                </div>
              );
            })}
            {(!data?.recentActivity?.stockMovements || data.recentActivity.stockMovements.length === 0) && (
              <p className="text-xs text-warmgray-400 text-center py-8">No recent stock movements recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
