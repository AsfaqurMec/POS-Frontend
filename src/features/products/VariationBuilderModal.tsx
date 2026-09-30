"use client";

import React, { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Item } from "@/types";
import { api } from "@/lib/api";

interface VariationBuilderModalProps {
  item: Item | null;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

export function VariationBuilderModal({ item, onClose, onRefresh }: VariationBuilderModalProps) {
  const [newGroupNameEn, setNewGroupNameEn] = useState("");
  const [newGroupNameAr, setNewGroupNameAr] = useState("");
  const [newGroupRequired, setNewGroupRequired] = useState(true);
  const [newGroupSelectionType, setNewGroupSelectionType] = useState<"SINGLE" | "MULTIPLE">("SINGLE");

  const [selectedGroupIdForOption, setSelectedGroupIdForOption] = useState<string | null>(null);
  const [newOptNameEn, setNewOptNameEn] = useState("");
  const [newOptNameAr, setNewOptNameAr] = useState("");
  const [newOptPriceAdj, setNewOptPriceAdj] = useState("0");

  if (!item) return null;

  const handleAddGroup = async () => {
    if (!newGroupNameEn || !newGroupNameAr) return;
    try {
      await api.post(`/items/${item.id}/variation-groups`, {
        nameEn: newGroupNameEn,
        nameAr: newGroupNameAr,
        required: newGroupRequired,
        selectionType: newGroupSelectionType,
      });
      setNewGroupNameEn("");
      setNewGroupNameAr("");
      await onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddOption = async (groupId: string) => {
    if (!newOptNameEn || !newOptNameAr) return;
    try {
      await api.post(`/variation-groups/${groupId}/options`, {
        nameEn: newOptNameEn,
        nameAr: newOptNameAr,
        priceAdjustment: parseFloat(newOptPriceAdj) || 0,
      });
      setNewOptNameEn("");
      setNewOptNameAr("");
      setNewOptPriceAdj("0");
      await onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateVariants = async () => {
    if (!confirm("Generate variant combinations from options? Existing variants will be preserved.")) return;
    try {
      const res = await api.post<any>(`/items/${item.id}/variants/generate`);
      alert(res.message);
      await onRefresh();
    } catch (err: any) {
      alert("Variant generation error: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-warmgray-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-warmgray-200 dark:border-warmgray-800 overflow-hidden">
        <div className="p-5 border-b border-warmgray-200 dark:border-warmgray-800 flex items-center justify-between shrink-0 bg-warmgray-50 dark:bg-warmgray-800/40">
          <div>
            <h2 className="font-bold text-base text-warmgray-900 dark:text-white">
              {item.nameEn} ({item.variationMode} MODE)
            </h2>
            <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">
              Manage variation groups, options, and combinations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-warmgray-500 hover:text-warmgray-800 dark:text-warmgray-400 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Existing Groups List */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-warmgray-900 dark:text-white">
              Active Variation Groups
            </h3>
            {item.variationGroups?.map((group) => (
              <div
                key={group.id}
                className="p-4 rounded-2xl border border-warmgray-200 dark:border-warmgray-700 space-y-3 bg-warmgray-50/50 dark:bg-warmgray-800/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-warmgray-900 dark:text-white">
                      {group.nameEn} / {group.nameAr}
                    </span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                      {group.selectionType} {group.required ? "(Required)" : "(Optional)"}
                    </span>
                  </div>
                </div>

                {/* Options Chips */}
                <div className="flex flex-wrap gap-2">
                  {group.options?.map((opt) => (
                    <div
                      key={opt.id}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 text-xs font-medium flex items-center gap-2"
                    >
                      <span>
                        {opt.nameEn} ({opt.nameAr})
                      </span>
                      {opt.priceAdjustment > 0 && (
                        <span className="font-bold text-amber-600">
                          +{opt.priceAdjustment} SAR
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Inline Add Option */}
                <div className="pt-2 border-t border-warmgray-200/60 dark:border-warmgray-700/60 flex flex-wrap gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Option En (e.g. Large)"
                    value={selectedGroupIdForOption === group.id ? newOptNameEn : ""}
                    onChange={(e) => {
                      setSelectedGroupIdForOption(group.id);
                      setNewOptNameEn(e.target.value);
                    }}
                    className="px-2.5 py-1.5 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Option Ar (مثال: كبير)"
                    value={selectedGroupIdForOption === group.id ? newOptNameAr : ""}
                    onChange={(e) => {
                      setSelectedGroupIdForOption(group.id);
                      setNewOptNameAr(e.target.value);
                    }}
                    className="px-2.5 py-1.5 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-lg text-xs text-end"
                  />
                  <input
                    type="number"
                    placeholder="+SAR"
                    value={selectedGroupIdForOption === group.id ? newOptPriceAdj : "0"}
                    onChange={(e) => {
                      setSelectedGroupIdForOption(group.id);
                      setNewOptPriceAdj(e.target.value);
                    }}
                    className="w-16 px-2.5 py-1.5 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddOption(group.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white"
                  >
                    + Option
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Group Box */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3">
            <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
              + Add New Variation Group
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Group Name En (e.g. Size)"
                value={newGroupNameEn}
                onChange={(e) => setNewGroupNameEn(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs"
              />
              <input
                type="text"
                placeholder="Group Name Ar (مثال: الحجم)"
                value={newGroupNameAr}
                onChange={(e) => setNewGroupNameAr(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs text-end"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGroupRequired}
                    onChange={(e) => setNewGroupRequired(e.target.checked)}
                  />
                  <span>Required</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="st"
                    checked={newGroupSelectionType === "SINGLE"}
                    onChange={() => setNewGroupSelectionType("SINGLE")}
                  />
                  <span>Single</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="st"
                    checked={newGroupSelectionType === "MULTIPLE"}
                    onChange={() => setNewGroupSelectionType("MULTIPLE")}
                  />
                  <span>Multiple</span>
                </label>
              </div>
              <button
                type="button"
                onClick={handleAddGroup}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
              >
                Add Group
              </button>
            </div>
          </div>

          {/* VARIANT MODE Cartesian Combinations Generator */}
          {item.variationMode === "VARIANT" && (
            <div className="pt-4 border-t border-warmgray-200 dark:border-warmgray-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-warmgray-900 dark:text-white">
                    Cartesian Variants ({item.variants?.length || 0})
                  </h4>
                  <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">
                    Generate Cartesian combinations from all group options
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateVariants}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Combinations</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {item.variants?.map((v) => {
                  const combo = v.variantOptions
                    .map((vo) => vo.variationOption.nameEn)
                    .join(" / ");
                  return (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-warmgray-900 dark:text-white">{combo}</p>
                        <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium">
                          SKU: {v.sku || "-"} | Stock: {v.stockQuantity}
                        </p>
                      </div>
                      <span className="font-bold text-amber-600">{v.price.toFixed(2)} SAR</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}