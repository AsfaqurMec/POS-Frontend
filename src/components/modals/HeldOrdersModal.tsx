"use client";

import React from "react";
import { X, Clock, ShoppingBag, Trash2, ArrowRight, Tag } from "lucide-react";
import { useHeldOrders, useDeleteHeldOrder, useBusiness } from "@/hooks/useQueries";
import { useCartStore } from "@/store/cartStore";
import { HeldOrder } from "@/types";

interface HeldOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HeldOrdersModal({ isOpen, onClose }: HeldOrdersModalProps) {
  const { data: heldOrders, isLoading } = useHeldOrders();
  const { data: business } = useBusiness();
  const deleteHeldMutation = useDeleteHeldOrder();
  const cartStore = useCartStore();

  if (!isOpen) return null;

  const currency = business?.currency || "SAR";

  const handleRecallOrder = async (held: HeldOrder) => {
    try {
      // Parse cart snapshot
      const parsed = JSON.parse(held.cartSnapshot);

      // Restore cart state
      cartStore.clearCart();
      if (parsed.items && Array.isArray(parsed.items)) {
        for (const item of parsed.items) {
          cartStore.addToCart(
            item.item,
            item.variant || null,
            item.selectedOptions || [],
            item.quantity || 1
          );
        }
      }

      if (parsed.discountType) {
        cartStore.setDiscount(parsed.discountType, parsed.discountValue || 0);
      }
      if (parsed.orderType) {
        cartStore.setOrderType(parsed.orderType);
      }
      if (held.customerName || held.customerPhone) {
        cartStore.setCustomerInfo(held.customerName || "", held.customerPhone || "");
      }

      // Delete from held orders table
      await deleteHeldMutation.mutateAsync(held.id);
      onClose();
    } catch (err) {
      console.error("Failed to recall held order:", err);
    }
  };

  const handleDiscard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteHeldMutation.mutateAsync(id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-warmgray-100 dark:border-warmgray-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-warmgray-900 dark:text-white">
                Parked & Held Orders
              </h3>
              <p className="text-xs text-warmgray-500 font-medium">
                {heldOrders?.length || 0} orders waiting in queue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-warmgray-100 dark:hover:bg-warmgray-800 text-warmgray-400 hover:text-warmgray-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 py-1">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-warmgray-400">Loading held orders...</div>
          ) : !heldOrders || heldOrders.length === 0 ? (
            <div className="py-12 text-center text-warmgray-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-xs font-bold">No held orders right now</p>
              <p className="text-[11px]">Click "Hold (F4)" in the cart to park an order for later recall.</p>
            </div>
          ) : (
            heldOrders.map((order) => {
              const minutesAgo = Math.floor(
                (Date.now() - new Date(order.createdAt).getTime()) / 60000
              );

              return (
                <div
                  key={order.id}
                  onClick={() => handleRecallOrder(order)}
                  className="p-4 rounded-2xl bg-warmgray-50 hover:bg-warmgray-100/80 dark:bg-warmgray-800/60 dark:hover:bg-warmgray-800 border border-warmgray-200/70 dark:border-warmgray-700/60 cursor-pointer transition group flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-mono">
                        {order.orderNumber || `#${order.id.slice(0, 6).toUpperCase()}`}
                      </span>
                      {order.tag && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-white flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>{order.tag}</span>
                        </span>
                      )}
                      <span className="text-xs font-bold text-warmgray-900 dark:text-white">
                        {order.customerName || "Walk-in Guest"}
                      </span>
                      <span className="text-[10px] text-warmgray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {minutesAgo === 0 ? "Just now" : `${minutesAgo}m ago`}
                      </span>
                    </div>

                    <p className="text-xs text-warmgray-500 font-medium">
                      {order.itemCount} items • {order.orderType}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                      {order.subtotal.toFixed(2)} {currency}
                    </span>

                    <button
                      onClick={(e) => handleDiscard(order.id, e)}
                      title="Discard order"
                      className="p-2 rounded-lg text-warmgray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="w-7 h-7 rounded-lg bg-warmgray-200 dark:bg-warmgray-700 flex items-center justify-center text-warmgray-600 dark:text-warmgray-300 group-hover:bg-amber-600 group-hover:text-white transition">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
