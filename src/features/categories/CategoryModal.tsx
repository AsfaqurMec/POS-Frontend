"use client";

import React, { useState, useEffect } from "react";
import { useLangStore } from "@/store/langStore";
import { Category } from "@/types";
import { X, Upload, Trash2, FolderTree } from "lucide-react";
import { getMediaUrl } from "@/lib/env";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData, editingCategoryId?: string) => Promise<void>;
  editingCategory: Category | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  editingCategory,
}: CategoryModalProps) {
  const { lang, t } = useLangStore();

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setNameEn(editingCategory.nameEn);
      setNameAr(editingCategory.nameAr);
      setDescEn(editingCategory.descriptionEn || "");
      setDescAr(editingCategory.descriptionAr || "");
      setSortOrder(editingCategory.sortOrder.toString());
      setActive(editingCategory.active);
      setImageFile(null);
      setImagePreview(
        editingCategory.imageUrl ? getMediaUrl(editingCategory.imageUrl) : null
      );
      setRemoveImage(false);
    } else {
      setNameEn("");
      setNameAr("");
      setDescEn("");
      setDescAr("");
      setSortOrder("0");
      setActive(true);
      setImageFile(null);
      setImagePreview(null);
      setRemoveImage(false);
    }
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !nameAr.trim()) {
      alert("Please provide category names in both English and Arabic.");
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append("nameEn", nameEn.trim());
      fd.append("nameAr", nameAr.trim());
      fd.append("descriptionEn", descEn.trim());
      fd.append("descriptionAr", descAr.trim());
      fd.append("sortOrder", sortOrder);
      fd.append("active", String(active));

      if (imageFile) {
        fd.append("image", imageFile);
      }
      if (removeImage) {
        fd.append("removeImage", "true");
      }

      await onSave(fd, editingCategory?.id);
      onClose();
    } catch (err: any) {
      alert("Failed to save category: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warmgray-100 dark:border-warmgray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-warmgray-900 dark:text-white">
                {editingCategory ? t.categories.editCategory : t.categories.addCategory}
              </h2>
              <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">
                {editingCategory ? editingCategory.nameEn : "Create a new category for POS menu"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-warmgray-500 hover:text-warmgray-800 dark:text-warmgray-400 dark:hover:text-warmgray-200 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.categories.nameEn} *
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Cold Brews"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.categories.nameAr} *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: القهوة المقطرة الباردة"
                dir="rtl"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.categories.descriptionEn}
              </label>
              <textarea
                rows={2}
                value={descEn}
                onChange={(e) => setDescEn(e.target.value)}
                placeholder="Category notes or highlights..."
                className="w-full px-3.5 py-2 bg-white dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.categories.descriptionAr}
              </label>
              <textarea
                rows={2}
                value={descAr}
                onChange={(e) => setDescAr(e.target.value)}
                placeholder="ملاحظات أو وصف توضيحي للقسم..."
                dir="rtl"
                className="w-full px-3.5 py-2 bg-white dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Sort Order & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.categories.sortOrder}
              </label>
              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-warmgray-200 peer-focus:outline-none rounded-full peer dark:bg-warmgray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-warmgray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
              <span className="font-bold text-warmgray-800 dark:text-warmgray-200">
                {active ? t.common.active : t.common.inactive}
              </span>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5">
              {t.categories.image}
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-warmgray-200 dark:border-warmgray-700 shadow-sm shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 end-1 p-1 rounded-lg bg-red-600/90 text-white hover:bg-red-700 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-warmgray-200 dark:border-warmgray-700 flex flex-col items-center justify-center text-warmgray-400 shrink-0">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-semibold">Upload</span>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium file:me-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-warmgray-800 dark:file:text-amber-400"
                />
                <p className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-medium mt-1.5">
                  Recommended size: 600×400px. PNG, JPG, or WEBP up to 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-warmgray-100 dark:border-warmgray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-warmgray-200 dark:border-warmgray-800 font-bold text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-900/30 transition disabled:opacity-50"
            >
              {isSubmitting ? t.common.loading : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
