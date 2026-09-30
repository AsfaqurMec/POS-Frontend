"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePosStore } from "@/store/posStore";
import { useLangStore } from "@/store/langStore";
import { useCartStore } from "@/store/cartStore";
import { X, Plus, Minus, Check, AlertCircle, Package } from "lucide-react";
import { CartItemOption, ProductVariant } from "@/types";
import { getMediaUrl } from "@/lib/env";

export function VariationModal() {
  const { isVariationModalOpen, activeProductForVariation, editingCartItem, closeVariationModal } =
    usePosStore();
  const { lang, t } = useLangStore();
  const { addToCart, updateCartItem } = useCartStore();

  const item = activeProductForVariation;
  const isOptionMode = item?.variationMode === "OPTION";
  const isVariantMode = item?.variationMode === "VARIANT";

  // State for Option Mode: map of groupId -> optionId[]
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string[]>>({});

  // State for Variant Mode: map of groupId -> optionId
  const [selectedVariantAttributes, setSelectedVariantAttributes] = useState<Record<string, string>>({});

  const [quantity, setQuantity] = useState(1);

  // Initialize selections when modal opens
  useEffect(() => {
    if (!item) return;

    if (editingCartItem) {
      setQuantity(editingCartItem.quantity);

      if (isOptionMode) {
        const initialMap: Record<string, string[]> = {};
        editingCartItem.selectedOptions.forEach((opt) => {
          if (!initialMap[opt.groupId]) initialMap[opt.groupId] = [];
          initialMap[opt.groupId].push(opt.optionId);
        });
        setSelectedOptionIds(initialMap);
      } else if (isVariantMode && editingCartItem.variant) {
        const initialAttrs: Record<string, string> = {};
        editingCartItem.variant.variantOptions.forEach((vo) => {
          initialAttrs[vo.variationGroupId] = vo.variationOptionId;
        });
        setSelectedVariantAttributes(initialAttrs);
      }
    } else {
      setQuantity(1);

      if (isOptionMode) {
        const defaultSelections: Record<string, string[]> = {};
        // Auto-select first option for required single-select groups
        item.variationGroups.forEach((group) => {
          if (group.required && group.selectionType === "SINGLE" && group.options.length > 0) {
            defaultSelections[group.id] = [group.options[0].id];
          } else {
            defaultSelections[group.id] = [];
          }
        });
        setSelectedOptionIds(defaultSelections);
      } else if (isVariantMode) {
        // Pre-select first valid combination
        const firstVariant = item.variants.find((v) => v.active && v.stockQuantity > 0) || item.variants[0];
        const defaultAttrs: Record<string, string> = {};
        if (firstVariant) {
          firstVariant.variantOptions.forEach((vo) => {
            defaultAttrs[vo.variationGroupId] = vo.variationOptionId;
          });
        }
        setSelectedVariantAttributes(defaultAttrs);
      }
    }
  }, [item, editingCartItem, isOptionMode, isVariantMode]);

  // Handle Option Mode selection
  const handleOptionToggle = (groupId: string, optionId: string, selectionType: "SINGLE" | "MULTIPLE") => {
    setSelectedOptionIds((prev) => {
      const current = prev[groupId] || [];
      if (selectionType === "SINGLE") {
        return { ...prev, [groupId]: [optionId] };
      } else {
        const exists = current.includes(optionId);
        const updated = exists ? current.filter((id) => id !== optionId) : [...current, optionId];
        return { ...prev, [groupId]: updated };
      }
    });
  };

  // Handle Variant Mode attribute selection
  const handleVariantAttributeSelect = (groupId: string, optionId: string) => {
    setSelectedVariantAttributes((prev) => ({
      ...prev,
      [groupId]: optionId,
    }));
  };

  // Find matching ProductVariant for current attributes
  const matchedVariant: ProductVariant | null = useMemo(() => {
    if (!item || !isVariantMode) return null;

    const groupIds = item.variationGroups.map((g) => g.id);
    const allSelected = groupIds.every((gid) => Boolean(selectedVariantAttributes[gid]));
    if (!allSelected) return null;

    return (
      item.variants.find((variant) => {
        if (!variant.active) return false;
        return variant.variantOptions.every(
          (vo) => selectedVariantAttributes[vo.variationGroupId] === vo.variationOptionId
        );
      }) || null
    );
  }, [item, isVariantMode, selectedVariantAttributes]);

  // Validation: Check if all required groups have selections
  const isValidSelection = useMemo(() => {
    if (!item) return false;

    if (isOptionMode) {
      for (const group of item.variationGroups) {
        if (group.required) {
          const selected = selectedOptionIds[group.id] || [];
          if (selected.length === 0) return false;
        }
      }
      return true;
    }

    if (isVariantMode) {
      return Boolean(
        matchedVariant &&
        matchedVariant.active &&
        (!item.stockEnabled || matchedVariant.stockQuantity >= quantity)
      );
    }

    if (item.stockEnabled && item.stockQuantity < quantity) {
      return false;
    }

    return true;
  }, [item, isOptionMode, isVariantMode, selectedOptionIds, matchedVariant, quantity]);

  // Calculate live unit price
  const calculatedUnitPrice = useMemo(() => {
    if (!item) return 0;

    if (isVariantMode) {
      return matchedVariant ? matchedVariant.price : item.basePrice;
    }

    let sum = item.basePrice;
    item.variationGroups.forEach((group) => {
      const selected = selectedOptionIds[group.id] || [];
      selected.forEach((optId) => {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) sum += opt.priceAdjustment;
      });
    });
    return sum;
  }, [item, isVariantMode, matchedVariant, selectedOptionIds]);

  const optionsAdjustment = useMemo(() => {
    if (!item || !isOptionMode) return 0;
    let sum = 0;
    item.variationGroups.forEach((group) => {
      const selected = selectedOptionIds[group.id] || [];
      selected.forEach((optId) => {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) sum += opt.priceAdjustment;
      });
    });
    return sum;
  }, [item, isOptionMode, selectedOptionIds]);

  const liveTotal = calculatedUnitPrice * quantity;

  // Add / Update handler
  const handleSaveToOrder = () => {
    if (!item || !isValidSelection) return;

    if (isVariantMode) {
      if (!matchedVariant) return;

      const variantOptions: CartItemOption[] = matchedVariant.variantOptions.map((vo) => ({
        groupId: vo.variationGroupId,
        groupNameEn: vo.variationGroup.nameEn,
        groupNameAr: vo.variationGroup.nameAr,
        optionId: vo.variationOptionId,
        optionNameEn: vo.variationOption.nameEn,
        optionNameAr: vo.variationOption.nameAr,
        priceAdjustment: 0.0,
      }));

      if (editingCartItem) {
        updateCartItem(editingCartItem.cartItemId, variantOptions, quantity);
      } else {
        addToCart(item, matchedVariant, variantOptions, quantity);
      }
    } else {
      // Option mode
      const selectedOptionsList: CartItemOption[] = [];
      item.variationGroups.forEach((group) => {
        const selected = selectedOptionIds[group.id] || [];
        selected.forEach((optId) => {
          const opt = group.options.find((o) => o.id === optId);
          if (opt) {
            selectedOptionsList.push({
              groupId: group.id,
              groupNameEn: group.nameEn,
              groupNameAr: group.nameAr,
              optionId: opt.id,
              optionNameEn: opt.nameEn,
              optionNameAr: opt.nameAr,
              priceAdjustment: opt.priceAdjustment,
            });
          }
        });
      });

      if (editingCartItem) {
        updateCartItem(editingCartItem.cartItemId, selectedOptionsList, quantity);
      } else {
        addToCart(item, null, selectedOptionsList, quantity);
      }
    }

    closeVariationModal();
  };

  if (!isVariationModalOpen || !item) return null;

  const productName = lang === "ar" ? item.nameAr : item.nameEn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-warmgray-900 rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col shadow-xl border border-warmgray-200 dark:border-warmgray-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-warmgray-200 dark:border-warmgray-800 flex items-center justify-between shrink-0 bg-warmgray-50/50 dark:bg-warmgray-800/40">
          <div className="flex items-center gap-3">
            {item.imageUrl && (
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-warmgray-200 dark:border-warmgray-700 bg-warmgray-100 dark:bg-warmgray-800">
                <img
                  src={getMediaUrl(item.imageUrl)}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-warmgray-900 dark:text-white leading-tight">
                {productName}
              </h2>
              <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-0.5">
                {t.pos.basePrice}: {item.basePrice.toFixed(2)} {t.common.sar}
              </p>
            </div>
          </div>
          <button
            onClick={closeVariationModal}
            className="p-2 text-warmgray-500 hover:text-warmgray-800 dark:text-warmgray-400 dark:hover:text-warmgray-200 rounded-full hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Groups Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* OPTION MODE GROUPS */}
          {isOptionMode &&
            item.variationGroups.map((group) => {
              const groupName = lang === "ar" ? group.nameAr : group.nameEn;
              const selectedIds = selectedOptionIds[group.id] || [];

              return (
                <div key={group.id} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-warmgray-900 dark:text-white">
                      {groupName}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        group.required
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"
                          : "bg-warmgray-100 text-warmgray-700 dark:bg-warmgray-800 dark:text-warmgray-300"
                      }`}
                    >
                      {group.required
                        ? lang === "ar"
                          ? "إجباري"
                          : "Required"
                        : lang === "ar"
                        ? "اختياري"
                        : "Optional"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((opt) => {
                      const optName = lang === "ar" ? opt.nameAr : opt.nameEn;
                      const isSelected = selectedIds.includes(opt.id);

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleOptionToggle(group.id, opt.id, group.selectionType)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all text-start ${
                            isSelected
                              ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 ring-2 ring-amber-600/30"
                              : "border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800/60 text-warmgray-800 dark:text-warmgray-200 hover:border-warmgray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-${
                                group.selectionType === "SINGLE" ? "full" : "md"
                              } border flex items-center justify-center ${
                                isSelected
                                  ? "bg-amber-600 border-amber-600 text-white"
                                  : "border-warmgray-500 dark:border-warmgray-400"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="leading-tight">{optName}</span>
                          </div>
                          {opt.priceAdjustment > 0 && (
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                              +{opt.priceAdjustment.toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

          {/* VARIANT MODE GROUPS */}
          {isVariantMode && (
            <div className="space-y-5">
              {item.variationGroups.map((group) => {
                const groupName = lang === "ar" ? group.nameAr : group.nameEn;
                const currentVal = selectedVariantAttributes[group.id];

                return (
                  <div key={group.id} className="space-y-2">
                    <h3 className="text-sm font-bold text-warmgray-900 dark:text-white">
                      {groupName}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const optName = lang === "ar" ? opt.nameAr : opt.nameEn;
                        const isSelected = currentVal === opt.id;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleVariantAttributeSelect(group.id, opt.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                              isSelected
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-white dark:bg-warmgray-800 text-warmgray-800 dark:text-warmgray-200 border-warmgray-200 dark:border-warmgray-700 hover:bg-warmgray-50"
                            }`}
                          >
                            {optName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Matched Variant Info Box */}
              {matchedVariant ? (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    matchedVariant.stockQuantity <= 0
                      ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40"
                      : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package
                      className={`w-5 h-5 ${
                        matchedVariant.stockQuantity <= 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    />
                    <div>
                      <p className="text-xs font-semibold text-warmgray-800 dark:text-warmgray-200">
                        SKU: {matchedVariant.sku || "N/A"}
                      </p>
                      <p
                        className={`text-[11px] font-bold ${
                          matchedVariant.stockQuantity <= 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-warmgray-700 dark:text-warmgray-300"
                        }`}
                      >
                        {matchedVariant.stockQuantity <= 0
                          ? t.pos.outOfStock
                          : `Stock: ${matchedVariant.stockQuantity} units available`}
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-bold text-amber-700 dark:text-amber-400">
                    {matchedVariant.price.toFixed(2)} {t.common.sar}
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>This combination is currently unavailable.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price Breakdown Banner */}
        <div className="px-6 py-2.5 bg-amber-50/80 dark:bg-amber-950/30 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 flex-wrap text-warmgray-700 dark:text-warmgray-300 font-medium">
            <span>
              {t.pos.basePrice || "Base"}:{" "}
              <strong className="text-warmgray-900 dark:text-white font-mono">
                {(isVariantMode && matchedVariant ? matchedVariant.price : item.basePrice).toFixed(2)} {t.common.sar}
              </strong>
            </span>
            {isOptionMode && optionsAdjustment > 0 && (
              <>
                <span className="text-amber-800 font-bold">+</span>
                <span>
                  {t.pos.addons || "Add-ons"}:{" "}
                  <strong className="text-amber-800 dark:text-amber-300 font-mono">
                    +{optionsAdjustment.toFixed(2)} {t.common.sar}
                  </strong>
                </span>
              </>
            )}
          </div>
          <div className="text-warmgray-700 dark:text-warmgray-300 font-medium">
            ={" "}
            <span className="font-bold text-warmgray-900 dark:text-white font-mono">
              {calculatedUnitPrice.toFixed(2)} {t.common.sar}
            </span>
            {quantity > 1 && <span className="text-[10px]"> /{t.pos.each || "unit"}</span>}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-warmgray-200 dark:border-warmgray-800 bg-warmgray-50/50 dark:bg-warmgray-900 shrink-0 flex items-center justify-between gap-4">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-700 transition"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-bold text-sm text-warmgray-900 dark:text-white">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-700 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSaveToOrder}
            disabled={!isValidSelection}
            className={`flex-1 flex items-center justify-between px-5 py-3 rounded-2xl font-bold text-sm text-white transition-all shadow-md ${
              isValidSelection
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-900/30 active:scale-[0.99]"
                : "bg-warmgray-400 cursor-not-allowed opacity-60"
            }`}
          >
            <span>{editingCartItem ? t.pos.updateOrder : t.pos.addToOrder}</span>
            <span>
              {liveTotal.toFixed(2)} {t.common.sar}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}