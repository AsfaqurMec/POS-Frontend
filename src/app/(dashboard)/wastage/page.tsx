"use client";

import React, { useState } from "react";
import {
  Flame,
  AlertTriangle,
  Scale,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Coffee,
} from "lucide-react";
import { useIngredients, useLogWastage, useWasteLogs, useBusiness } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { useAuthStore } from "@/store/authStore";

export default function WastageAndBOMPage() {
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";
  const { data: business } = useBusiness();
  const { data: ingredients, isLoading: isIngLoading, refetch: refetchIng } = useIngredients();
  const { data: wasteData, isLoading: isWasteLoading, refetch: refetchWaste } = useWasteLogs(50, 1);
  const logWasteMutation = useLogWastage();

  const [activeTab, setActiveTab] = useState<"INGREDIENTS" | "LOG_WASTE" | "HISTORY">("INGREDIENTS");

  // Log waste form state
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [wasteQuantity, setWasteQuantity] = useState<number>(50);
  const [wasteReason, setWasteReason] = useState<string>("DIAL_IN");
  const [wasteNotes, setWasteNotes] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const currency = business?.currency || "SAR";

  const handleLogWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !selectedIngredientId || wasteQuantity <= 0) return;

    try {
      await logWasteMutation.mutateAsync({
        ingredientId: selectedIngredientId,
        quantity: wasteQuantity,
        reason: wasteReason,
        notes: wasteNotes,
      });

      setSuccessMsg("Wastage logged and raw stock decremented successfully.");
      setSelectedIngredientId("");
      setWasteNotes("");
      refetchIng();
      refetchWaste();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-warmgray-900 dark:text-white">
              Recipe Inventory (BOM) & Wastage
            </h1>
            <p className="text-xs text-warmgray-500 font-medium">
              Raw ingredients, grinder dial-in waste, spillage & cost accounting
            </p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="inline-flex p-1 bg-warmgray-100 dark:bg-warmgray-800 rounded-2xl border border-warmgray-200 dark:border-warmgray-700">
          <button
            onClick={() => setActiveTab("INGREDIENTS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "INGREDIENTS"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-warmgray-600 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
            }`}
          >
            Raw Ingredients (BOM)
          </button>
          <button
            onClick={() => setActiveTab("LOG_WASTE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "LOG_WASTE"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-warmgray-600 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
            }`}
          >
            + Log Waste & Dial-in
          </button>
          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === "HISTORY"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-warmgray-600 dark:text-warmgray-300 hover:text-warmgray-900 dark:hover:text-white"
            }`}
          >
            Wastage Ledger
          </button>
        </div>
      </div>

      {/* 1. RAW INGREDIENTS VIEW */}
      {activeTab === "INGREDIENTS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(ingredients || []).map((ing) => (
              <div
                key={ing.id}
                className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-base text-warmgray-900 dark:text-white">
                      {ing.nameEn}
                    </h3>
                    <p className="text-xs text-warmgray-500 font-arabic">{ing.nameAr}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      ing.isLowStock
                        ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    }`}
                  >
                    {ing.isLowStock ? "Low Stock" : "Optimal"}
                  </span>
                </div>

                <div className="p-3 bg-warmgray-50 dark:bg-warmgray-800/60 rounded-2xl flex items-baseline justify-between">
                  <span className="text-xs font-bold text-warmgray-500">Current Stock:</span>
                  <span className="text-xl font-black text-warmgray-900 dark:text-white">
                    {ing.currentStock.toLocaleString()}{" "}
                    <span className="text-xs font-bold text-warmgray-400">{ing.unit}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-warmgray-100 dark:border-warmgray-800">
                  <div>
                    <span className="text-[10px] text-warmgray-400 font-bold uppercase">Unit Cost</span>
                    <p className="font-bold text-warmgray-800 dark:text-warmgray-200">
                      {ing.costPerUnit.toFixed(3)} {currency} / {ing.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-warmgray-400 font-bold uppercase">Total Value</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      {(ing.stockValuation || 0).toFixed(2)} {currency}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. LOG WASTAGE FORM */}
      {activeTab === "LOG_WASTE" && (
        <div className="max-w-xl mx-auto bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-black text-warmgray-900 dark:text-white">
              Log Raw Material Wastage & Calibration
            </h2>
            <p className="text-xs text-warmgray-500 font-medium">
              Record daily grinder dial-in coffee grams, spilt milk, or expired ingredients.
            </p>
          </div>

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogWaste} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                Select Ingredient
              </label>
              <select
                value={selectedIngredientId}
                onChange={(e) => setSelectedIngredientId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-2xl text-xs font-bold text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Choose an ingredient...</option>
                {(ingredients || []).map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.nameEn} ({ing.currentStock} {ing.unit} in stock)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                Quantity Wasted
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={wasteQuantity}
                onChange={(e) => setWasteQuantity(Math.max(0.1, Number(e.target.value)))}
                required
                className="w-full px-4 py-3 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-2xl text-sm font-black text-warmgray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                Reason for Waste
              </label>
              <select
                value={wasteReason}
                onChange={(e) => setWasteReason(e.target.value)}
                className="w-full px-4 py-3 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-2xl text-xs font-bold text-warmgray-900 dark:text-white"
              >
                <option value="DIAL_IN">Morning Grinder Dial-in Calibration</option>
                <option value="SPILLAGE">Barista Spillage / Accidental Drop</option>
                <option value="SPOILAGE">Sour / Spoiled Milk or Defective</option>
                <option value="EXPIRED">Passed Expiration Date</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                Barista Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 3 test shots to dial in espresso extraction ratio 1:2"
                value={wasteNotes}
                onChange={(e) => setWasteNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-2xl text-xs text-warmgray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={logWasteMutation.isPending || !selectedIngredientId || isGuest}
              className={`w-full py-3.5 font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 ${
                isGuest
                  ? "bg-warmgray-400 text-white cursor-not-allowed opacity-60"
                  : "bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white shadow-amber-600/20"
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>
                {isGuest
                  ? "Wastage Logging Disabled (Guest Mode)"
                  : logWasteMutation.isPending
                  ? "Logging..."
                  : "Record Wastage & Decrement Stock"}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* 3. WASTAGE HISTORY AUDIT LEDGER */}
      {activeTab === "HISTORY" && (
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-warmgray-100 dark:border-warmgray-800">
            <h3 className="text-base font-black text-warmgray-900 dark:text-white">
              Wastage Audit History
            </h3>
            <div className="text-end">
              <span className="text-xs font-bold text-red-500">
                Total Cost Lost: {(wasteData?.totalCostLost || 0).toFixed(2)} {currency}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-warmgray-50 dark:bg-warmgray-950/80 text-warmgray-600 dark:text-warmgray-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4 text-start">Date / Time</th>
                  <th className="py-3 px-4 text-start">Ingredient / Item</th>
                  <th className="py-3 px-4 text-start">Reason</th>
                  <th className="py-3 px-4 text-start">Quantity</th>
                  <th className="py-3 px-4 text-start">Monetary Cost</th>
                  <th className="py-3 px-4 text-start">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800">
                {(wasteData?.logs || []).map((log) => (
                  <tr key={log.id} className="hover:bg-warmgray-50 dark:hover:bg-warmgray-800/40">
                    <td className="py-3 px-4 text-warmgray-500 font-mono">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-warmgray-900 dark:text-white">
                      {log.ingredient?.nameEn || log.item?.nameEn || "Raw Material"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        {log.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-warmgray-800 dark:text-warmgray-200">
                      {log.quantity} {log.ingredient?.unit || "units"}
                    </td>
                    <td className="py-3 px-4 font-black text-red-500">
                      -{log.cost.toFixed(2)} {currency}
                    </td>
                    <td className="py-3 px-4 text-warmgray-500">{log.notes || "-"}</td>
                  </tr>
                ))}
                {(!wasteData?.logs || wasteData.logs.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-warmgray-400">
                      No wastage records found yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
