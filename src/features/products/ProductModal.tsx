"use client";

import React, { useState, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { Category, Item, VariationMode } from "@/types";
import { getMediaUrl } from "@/lib/env";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData, editingItemId?: string) => Promise<void>;
  editingItem: Item | null;
  categories: Category[];
}

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  categories,
}: ProductModalProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [basePrice, setBasePrice] = useState("12");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [stockEnabled, setStockEnabled] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("0");
  const [variationMode, setVariationMode] = useState<VariationMode>("NONE");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setNameEn(editingItem.nameEn);
      setNameAr(editingItem.nameAr);
      setDescEn(editingItem.descriptionEn || "");
      setDescAr(editingItem.descriptionAr || "");
      setCategoryId(editingItem.categoryId);
      setBasePrice(editingItem.basePrice.toString());
      setSku(editingItem.sku || "");
      setBarcode(editingItem.barcode || "");
      setStockEnabled(editingItem.stockEnabled);
      setStockQuantity(editingItem.stockQuantity.toString());
      setVariationMode(editingItem.variationMode);
      setImageFile(null);
      setImagePreview(editingItem.imageUrl ? getMediaUrl(editingItem.imageUrl) : null);
    } else {
      setNameEn("");
      setNameAr("");
      setDescEn("");
      setDescAr("");
      setCategoryId(categories?.[0]?.id || "");
      setBasePrice("12");
      setSku("");
      setBarcode("");
      setStockEnabled(false);
      setStockQuantity("0");
      setVariationMode("NONE");
      setImageFile(null);
      setImagePreview(null);
    }
  }, [editingItem, categories, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameAr || !categoryId) {
      alert("Please fill required fields (Name En, Name Ar, Category)");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nameEn", nameEn);
      formData.append("nameAr", nameAr);
      formData.append("descriptionEn", descEn);
      formData.append("descriptionAr", descAr);
      formData.append("categoryId", categoryId);
      formData.append("basePrice", basePrice);
      formData.append("sku", sku);
      formData.append("barcode", barcode);
      formData.append("stockEnabled", String(stockEnabled));
      formData.append("stockQuantity", stockQuantity);
      formData.append("variationMode", variationMode);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      await onSave(formData, editingItem?.id);
      onClose();
    } catch (err: any) {
      alert("Failed to save product: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-warmgray-900 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-warmgray-200 dark:border-warmgray-800 overflow-hidden">
        <div className="p-5 border-b border-warmgray-200 dark:border-warmgray-800 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-base text-warmgray-900 dark:text-white">
            {editingItem ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-warmgray-500 hover:text-warmgray-800 dark:text-warmgray-400 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Image Preview & Upload */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-warmgray-100 dark:bg-warmgray-800 border-2 border-dashed border-warmgray-300 dark:border-warmgray-700 flex items-center justify-center overflow-hidden shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-warmgray-500 dark:text-warmgray-400" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                Product Image
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium file:me-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
              />
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                Name (English) *
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Vanilla Flat White"
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                Name (Arabic) *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: فلات وايت فانيليا"
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-end"
              />
            </div>
          </div>

          {/* Category & Base Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
              >
                <option value="">Select Category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn} ({c.nameAr})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                Base Price (SAR) *
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="HOT-FLAT-001"
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                Barcode
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="6281001003"
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* Variation Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-warmgray-900 dark:text-white mb-1.5">
              Variation Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: "NONE", label: "None (Simple)" },
                { mode: "OPTION", label: "Option Mode (Drinks)" },
                { mode: "VARIANT", label: "Variant Mode (Inventory)" },
              ].map((item) => (
                <button
                  key={item.mode}
                  type="button"
                  onClick={() => setVariationMode(item.mode as VariationMode)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-start transition ${
                    variationMode === item.mode
                      ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-600/30"
                      : "border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Tracking */}
          <div className="p-3.5 rounded-2xl bg-warmgray-50 dark:bg-warmgray-800/40 border border-warmgray-200 dark:border-warmgray-800 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={stockEnabled}
                onChange={(e) => setStockEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs font-bold text-warmgray-900 dark:text-white">
                Track Stock Quantity
              </span>
            </label>

            {stockEnabled && (
              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                  Available Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold"
                />
              </div>
            )}
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-warmgray-100 hover:bg-warmgray-200 text-warmgray-700 dark:bg-warmgray-800 dark:text-warmgray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/30"
            >
              {isSubmitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}