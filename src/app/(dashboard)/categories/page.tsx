"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCategories } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { usePosStore } from "@/store/posStore";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/env";
import { useQueryClient } from "@tanstack/react-query";
import { Category } from "@/types";
import { CategoryModal } from "@/features/categories/CategoryModal";
import {
  FolderTree,
  Plus,
  Search,
  Coffee,
  Store,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { Pagination } from "@/components/common/Pagination";

export default function CategoriesPage() {
  const { lang, t, dir } = useLangStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setSelectedCategoryId } = usePosStore();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useCategories(true);

  const filteredCategories = (categories || []).filter((cat) => {
    // Status filter
    if (statusFilter === "ACTIVE" && !cat.active) return false;
    if (statusFilter === "INACTIVE" && cat.active) return false;

    // Search query
    if (!search) return true;
    const q = search.toLowerCase().trim();
    return (
      cat.nameEn.toLowerCase().includes(q) ||
      cat.nameAr.toLowerCase().includes(q) ||
      (cat.descriptionEn && cat.descriptionEn.toLowerCase().includes(q)) ||
      (cat.descriptionAr && cat.descriptionAr.toLowerCase().includes(q))
    );
  });

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, viewMode]);

  const totalPages = Math.ceil(filteredCategories.length / pageSize) || 1;
  const paginatedCategories = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, page, pageSize]);

  const totalCategories = categories?.length || 0;
  const totalProducts = (categories || []).reduce(
    (sum, c) => sum + (c._count?.items ?? 0),
    0
  );
  const activeCount = (categories || []).filter((c) => c.active).length;
  
  // Find top category by product count
  const topCategory = (categories || []).reduce<Category | null>((prev, current) => {
    if (!prev) return current;
    return (current._count?.items ?? 0) > (prev._count?.items ?? 0) ? current : prev;
  }, null);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (formData: FormData, id?: string) => {
    if (id) {
      await api.patch(`/categories/${id}`, formData, true);
    } else {
      await api.post("/categories", formData, true);
    }
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const handleDeleteCategory = async (id: string, itemCount: number) => {
    if (itemCount > 0) {
      alert(t.categories.deleteConfirm || "Cannot delete category containing products. Reassign or delete products first.");
      return;
    }
    if (!confirm(t.common.confirm || "Are you sure you want to delete this category?")) return;

    try {
      await api.delete(`/categories/${id}`);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      alert("Failed to delete category: " + err.message);
    }
  };

  const handleOpenInPos = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    router.push("/pos");
  };

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-16 bg-[#F7F3EE]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1C140E] dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#2B1D16] text-amber-200 flex items-center justify-center shadow-sm">
              <FolderTree className="w-5 h-5" />
            </div>
            <span>{t.categories.title || "Menu Categories"}</span>
          </h1>
          <p className="text-xs text-warmgray-600 dark:text-warmgray-400 mt-1 font-medium">
            {t.categories.subtitle || "Organize your specialty drinks, food, and beans menu"}
          </p>
        </div>

        {!isGuest && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs bg-[#2B1D16] hover:bg-[#3D271D] text-white shadow-md shadow-black/10 transition self-start sm:self-auto active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-200" />
            <span>{t.categories.addCategory || "New Category"}</span>
          </button>
        )}
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Categories */}
        <div className="bg-white dark:bg-warmgray-900 border border-[#E8DFD7] dark:border-warmgray-800 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] dark:bg-warmgray-800 border border-[#E8DFD7] dark:border-warmgray-700 text-[#2B1D16] flex items-center justify-center shrink-0">
            <FolderTree className="w-6 h-6 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-warmgray-700 dark:text-warmgray-400 font-bold truncate">
              {t.categories.totalCategories || "Total Categories"}
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#1C140E] dark:text-white mt-0.5">
              {totalCategories}
            </p>
          </div>
        </div>

        {/* Total Menu Items */}
        <div className="bg-white dark:bg-warmgray-900 border border-[#E8DFD7] dark:border-warmgray-800 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] dark:bg-warmgray-800 border border-[#E8DFD7] dark:border-warmgray-700 text-amber-800 flex items-center justify-center shrink-0">
            <Coffee className="w-6 h-6 text-amber-800 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-warmgray-700 dark:text-warmgray-400 font-bold truncate">
              {t.categories.totalProducts || "Cataloged Items"}
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#1C140E] dark:text-white mt-0.5">
              {totalProducts}
            </p>
          </div>
        </div>

        {/* Active Categories */}
        <div className="bg-white dark:bg-warmgray-900 border border-[#E8DFD7] dark:border-warmgray-800 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-warmgray-700 dark:text-warmgray-400 font-bold truncate">
              {t.categories.activeCategories || "Active on Menu"}
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              {activeCount}
            </p>
          </div>
        </div>

        {/* Top Category */}
        <div className="bg-white dark:bg-warmgray-900 border border-[#E8DFD7] dark:border-warmgray-800 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-warmgray-700 dark:text-warmgray-400 font-bold truncate">
              Top Category
            </p>
            <p className="text-sm sm:text-base font-black text-[#1C140E] dark:text-white mt-0.5 truncate">
              {topCategory ? (lang === "ar" ? topCategory.nameAr : topCategory.nameEn) : "-"}
            </p>
            <p className="text-[10px] text-amber-800 dark:text-amber-400 font-bold">
              {topCategory?._count?.items ?? 0} items
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-warmgray-900 p-3 rounded-2xl border border-[#E8DFD7] dark:border-warmgray-800 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-500 dark:text-warmgray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.categories.searchCategories || "Search categories by name..."}
            className="w-full ps-10 pe-8 py-2 bg-[#FAF7F2] dark:bg-warmgray-800 border border-[#E8DFD7] dark:border-warmgray-700 rounded-xl text-xs text-[#1C140E] dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-600 transition placeholder:text-warmgray-500 dark:placeholder:text-warmgray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-warmgray-500 hover:text-warmgray-900 dark:text-warmgray-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters + View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#FAF7F2] dark:bg-warmgray-800 p-1 rounded-xl border border-[#E8DFD7] dark:border-warmgray-700">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === "ALL"
                  ? "bg-[#2B1D16] text-white shadow-2xs"
                  : "text-warmgray-700 hover:text-warmgray-900 dark:text-warmgray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === "ACTIVE"
                  ? "bg-[#2B1D16] text-white shadow-2xs"
                  : "text-warmgray-700 hover:text-warmgray-900 dark:text-warmgray-300"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === "INACTIVE"
                  ? "bg-[#2B1D16] text-white shadow-2xs"
                  : "text-warmgray-700 hover:text-warmgray-900 dark:text-warmgray-300"
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Grid vs Table view toggle */}
          <div className="flex items-center bg-[#FAF7F2] dark:bg-warmgray-800 p-1 rounded-xl border border-[#E8DFD7] dark:border-warmgray-700">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-white dark:bg-warmgray-700 text-[#2B1D16] dark:text-white shadow-2xs"
                  : "text-warmgray-600 hover:text-warmgray-900 dark:text-warmgray-400"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "table"
                  ? "bg-white dark:bg-warmgray-700 text-[#2B1D16] dark:text-white shadow-2xs"
                  : "text-warmgray-600 hover:text-warmgray-900 dark:text-warmgray-400"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Categories Display Area */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-64 bg-white border border-[#E8DFD7] rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          viewMode === "grid" ? (
            /* LUXURY GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedCategories.map((cat) => {
                const name = lang === "ar" ? cat.nameAr : cat.nameEn;
                const subName = lang === "ar" ? cat.nameEn : cat.nameAr;
                const description =
                  lang === "ar"
                    ? cat.descriptionAr || cat.descriptionEn
                    : cat.descriptionEn || cat.descriptionAr;
                const itemCount = cat._count?.items ?? 0;

                return (
                  <div
                    key={cat.id}
                    className="group bg-white border border-[#E8DFD7] rounded-3xl overflow-hidden shadow-xs hover:border-amber-600 hover:shadow-md transition-all duration-300 flex flex-col"
                  >
                    {/* Cover Image Header */}
                    <div className="relative w-full aspect-[16/10] bg-[#F5EFE6] overflow-hidden">
                      {cat.imageUrl ? (
                        <img
                          src={getMediaUrl(cat.imageUrl)}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-800/40">
                          <FolderTree className="w-14 h-14" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 start-3 end-3 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black backdrop-blur-xs shadow-xs ${
                            cat.active
                              ? "bg-emerald-600/90 text-white"
                              : "bg-red-600/90 text-white"
                          }`}
                        >
                          {cat.active ? "Active" : "Inactive"}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/95 text-[#2B1D16] shadow-xs">
                          {itemCount} Items
                        </span>
                      </div>

                      {/* Name Overlay at Bottom of Image */}
                      <div className="absolute bottom-3 start-3.5 end-3.5 text-white">
                        <h3 className="font-bold text-base leading-tight drop-shadow-sm">
                          {name}
                        </h3>
                        {subName && (
                          <p className="text-[11px] text-amber-200/90 drop-shadow-xs line-clamp-1 mt-0.5">
                            {subName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Content & Actions */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        {description ? (
                          <p className="text-xs text-warmgray-700 dark:text-warmgray-300 line-clamp-2 leading-relaxed">
                            {description}
                          </p>
                        ) : (
                          <p className="text-xs text-warmgray-500 dark:text-warmgray-400 italic">
                            No description provided
                          </p>
                        )}
                      </div>

                      {/* Action Row */}
                      <div className="pt-3 border-t border-[#F0EAE4] dark:border-warmgray-800 flex items-center justify-between gap-1.5">
                        <Link
                          href={`/categories/${cat.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF7F2] hover:bg-[#F5EFE6] dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-[#2B1D16] dark:text-white border border-[#E8DFD7] dark:border-warmgray-700 transition shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                          <span>View Products</span>
                        </Link>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenInPos(cat.id)}
                            title="Open in POS"
                            className="p-1.5 rounded-xl text-warmgray-600 hover:text-amber-800 hover:bg-amber-50 dark:text-warmgray-400 dark:hover:text-amber-300 transition border border-transparent hover:border-amber-200"
                          >
                            <Store className="w-4 h-4" />
                          </button>
                          {!isGuest && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(cat)}
                                title="Edit Category"
                                className="p-1.5 rounded-xl text-warmgray-600 hover:text-blue-700 hover:bg-blue-50 dark:text-warmgray-400 dark:hover:text-blue-300 transition border border-transparent hover:border-blue-200"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id, itemCount)}
                                title="Delete Category"
                                className="p-1.5 rounded-xl text-warmgray-600 hover:text-red-700 hover:bg-red-50 dark:text-warmgray-400 dark:hover:text-red-300 transition border border-transparent hover:border-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* PROFESSIONAL TABLE VIEW */
            <div className="bg-white dark:bg-warmgray-900 border border-[#E8DFD7] dark:border-warmgray-800 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-start text-xs">
                <thead className="bg-[#FAF7F2] dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-[#E8DFD7] dark:border-warmgray-700 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 text-start">Category</th>
                    <th className="py-3.5 px-4 text-start">Arabic Name</th>
                    <th className="py-3.5 px-4 text-start">Description</th>
                    <th className="py-3.5 px-4 text-center">Items</th>
                    <th className="py-3.5 px-4 text-center">Order</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EFE6]">
                  {paginatedCategories.map((cat) => {
                    const itemCount = cat._count?.items ?? 0;
                    return (
                      <tr key={cat.id} className="hover:bg-[#FAF7F2]/60 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#F5EFE6] border border-[#E8DFD7] overflow-hidden shrink-0 flex items-center justify-center">
                              {cat.imageUrl ? (
                                <img
                                  src={getMediaUrl(cat.imageUrl)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FolderTree className="w-5 h-5 text-amber-800" />
                              )}
                            </div>
                            <span className="font-bold text-[#1C140E] text-sm">
                              {cat.nameEn}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1C140E] dark:text-white">
                          {cat.nameAr}
                        </td>
                        <td className="py-3 px-4 text-warmgray-700 dark:text-warmgray-300 max-w-xs truncate">
                          {cat.descriptionEn || cat.descriptionAr || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-black text-xs text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                            {itemCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-warmgray-700 dark:text-warmgray-300">
                          #{cat.sortOrder}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              cat.active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {cat.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/categories/${cat.id}`}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF7F2] hover:bg-[#F5EFE6] dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-[#2B1D16] dark:text-white border border-[#E8DFD7] dark:border-warmgray-700 transition"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleOpenInPos(cat.id)}
                              title="Open in POS"
                              className="p-1 rounded-lg text-warmgray-600 hover:text-amber-800 hover:bg-amber-50 dark:text-warmgray-400 dark:hover:text-amber-300 transition"
                            >
                              <Store className="w-3.5 h-3.5" />
                            </button>
                            {!isGuest && (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(cat)}
                                  title="Edit"
                                  className="p-1 rounded-lg text-warmgray-600 hover:text-blue-700 hover:bg-blue-50 dark:text-warmgray-400 dark:hover:text-blue-300 transition"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.id, itemCount)}
                                  title="Delete"
                                  className="p-1 rounded-lg text-warmgray-600 hover:text-red-700 hover:bg-red-50 dark:text-warmgray-400 dark:hover:text-red-300 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-warmgray-600 dark:text-warmgray-400">
            <FolderTree className="w-14 h-14 mb-2 opacity-30" />
            <p className="text-base font-bold text-[#1C140E] dark:text-white">No categories found</p>
            <p className="text-xs text-warmgray-600 dark:text-warmgray-400 mt-0.5">Try searching with different keywords</p>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredCategories.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-warmgray-200 dark:border-warmgray-800 shadow-xs">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredCategories.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[8, 12, 24, 48]}
              className="border-t-0"
            />
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
        editingCategory={editingCategory}
      />
    </div>
  );
}
