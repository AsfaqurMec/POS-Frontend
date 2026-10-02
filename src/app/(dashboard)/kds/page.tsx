"use client";

import React, { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useKdsOrders, useUpdateKdsStatus } from "@/hooks/useQueries";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/lib/env";
import { KdsOrder } from "@/types";

export default function KdsPage() {
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";
  const [station, setStation] = useState<"ALL" | "BARISTA" | "KITCHEN">("ALL");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { data: orders, isLoading, refetch } = useKdsOrders(station);
  const updateStatusMutation = useUpdateKdsStatus();

  // Listen to Server-Sent Events (SSE) for instant new order dispatch
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/kds/stream`);
      eventSource.addEventListener("ORDER_CREATED", () => {
        refetch();
        playChime();
      });
      eventSource.addEventListener("ORDER_UPDATED", () => {
        refetch();
      });
    } catch (err) {
      console.warn("SSE connection error:", err);
    }
    return () => { eventSource?.close(); };
  }, [refetch]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch { /* AudioContext blocked until user interacts */ }
  };

  const handleBump = async (orderId: string, currentStatus: string) => {
    if (isGuest) return;
    let nextStatus = "PREPARING";
    if (currentStatus === "PREPARING") nextStatus = "READY";
    else if (currentStatus === "READY") nextStatus = "SERVED";
    try {
      setUpdatingOrderId(orderId);
      await updateStatusMutation.mutateAsync({ saleId: orderId, status: nextStatus });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const activeOrders = (orders || []).filter(
    (o) => o.status !== "SERVED" && (o as any).status !== "VOIDED" && (o as any).status !== "CANCELLED"
  );

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto space-y-6 pb-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-warmgray-900 dark:text-white">
              Kitchen Display System (KDS)
            </h1>
            <p className="text-xs text-warmgray-500 font-medium">
              Live preparation queue • Real-time bump bar dispatch
            </p>
          </div>
        </div>

        {/* Station Filter Tabs & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 bg-warmgray-100 dark:bg-warmgray-800 rounded-2xl border border-warmgray-200 dark:border-warmgray-700">
            {(["ALL", "BARISTA", "KITCHEN"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStation(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  station === s
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-warmgray-600 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
                }`}
              >
                {s === "ALL" ? "All Stations" : s === "BARISTA" ? "☕ Espresso Bar" : "🥐 Bakery / Warmers"}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-warmgray-100 dark:bg-warmgray-800 hover:bg-warmgray-200 dark:hover:bg-warmgray-700 text-warmgray-600 dark:text-warmgray-300 transition border border-warmgray-200 dark:border-warmgray-700"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="py-24 text-center text-sm text-warmgray-400">Loading active tickets...</div>
      ) : activeOrders.length === 0 ? (
        <div className="py-24 text-center text-warmgray-400 space-y-3">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 opacity-60" />
          <h3 className="text-base font-bold text-warmgray-700 dark:text-warmgray-300">All Orders Caught Up!</h3>
          <p className="text-xs text-warmgray-500">No active drink or bakery tickets waiting for prep.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {activeOrders.map((order) => {
            const elapsedMins = Math.floor(
              (Date.now() - new Date(order.createdAt).getTime()) / 60000
            );
            const timerColor =
              elapsedMins >= 6
                ? "bg-red-500 text-white animate-pulse"
                : elapsedMins >= 3
                ? "bg-amber-500 text-white"
                : "bg-emerald-500 text-white";
            const isPreparing = order.status === "PREPARING";
            const isReady = order.status === "READY";

            return (
              <div
                key={order.id}
                className={`bg-white dark:bg-warmgray-900 border rounded-3xl shadow-md overflow-hidden flex flex-col justify-between transition ${
                  isReady
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : isPreparing
                    ? "border-amber-500/70"
                    : "border-warmgray-200 dark:border-warmgray-800"
                }`}
              >
                {/* Ticket Top Bar */}
                <div className="p-4 border-b border-warmgray-100 dark:border-warmgray-800 space-y-2 bg-warmgray-50/70 dark:bg-warmgray-800/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="font-mono text-sm font-black text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-800 tracking-wide shadow-2xs">
                        {order.orderNumber || (order.invoice?.invoiceNumber
                          ? order.invoice.invoiceNumber.replace("INV-", "ORD-")
                          : `ORD-${order.id.slice(0, 6).toUpperCase()}`)}
                      </span>
                      {order.invoice?.invoiceNumber && (
                        <span className="font-mono text-[10px] text-warmgray-500 font-semibold truncate">
                          {order.invoice.invoiceNumber}
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 shrink-0 ${timerColor}`}>
                      <Clock className="w-3 h-3" />
                      <span>{elapsedMins}m</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-600 dark:text-amber-400">{order.orderType}</span>
                    <span className="text-[11px] text-warmgray-600 dark:text-warmgray-300 font-bold truncate">
                      {order.customerName || "Walk-in Guest"}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 space-y-3 divide-y divide-warmgray-100 dark:divide-warmgray-800/60 overflow-y-auto max-h-72">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black text-xs shrink-0 mt-0.5">
                          {item.quantity}x
                        </span>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-warmgray-900 dark:text-white leading-snug">
                            {item.itemNameEnSnapshot}
                          </p>
                          {item.options && item.options.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.options.map((opt, oIdx) => (
                                <span
                                  key={oIdx}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-600 dark:text-warmgray-300 font-semibold"
                                >
                                  + {opt.optionNameEn}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bump Bar Action Button */}
                <div className="p-3 border-t border-warmgray-100 dark:border-warmgray-800 bg-warmgray-50/50 dark:bg-warmgray-800/20">
                  <button
                    onClick={() => handleBump(order.id, order.status)}
                    disabled={updatingOrderId === order.id || isGuest}
                    title={isGuest ? "View only in Guest Mode" : undefined}
                    className={`w-full py-3 rounded-2xl font-black text-xs transition active:scale-95 flex items-center justify-center gap-2 shadow-sm ${
                      isGuest
                        ? "bg-warmgray-700/50 text-warmgray-400 cursor-not-allowed"
                        : isReady
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                        : isPreparing
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                        : "bg-warmgray-900 hover:bg-black text-white dark:bg-warmgray-100 dark:text-warmgray-900"
                    }`}
                  >
                    {updatingOrderId === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>
                      {isGuest
                        ? "View Only (Guest Mode)"
                        : updatingOrderId === order.id
                        ? "Updating..."
                        : isReady
                        ? "Complete & Served"
                        : isPreparing
                        ? "Mark Ready for Pickup"
                        : "Start Preparing"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
