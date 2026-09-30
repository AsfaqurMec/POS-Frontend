"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useItems, useCategories } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { api } from "@/lib/api";
import {
  Plus,
  Search,
  Coffee,
  LayoutGrid,
  List,
  Layers,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Sparkles,
} from "lucide-react";
import { Item } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { ProductList } from "@/features/products/ProductList";
import { ProductModal } from "@/features/products/ProductModal";
import { VariationBuilderModal } from "@/features/products/VariationBuilderModal";
import { Pagination } from "@/components/common/Pagination";

export default function ProductsPage() {
  const { lang, t } = useLangStore();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";
  const queryClient = useQueryClient();

  const [selectedCatId, setSelectedCatId] = useState("all");
  const [search, setSearch] = useState("");
  const [variationFilter, setVariationFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const { data: categories = [] } = useCategories(true);
  const { data: rawItems = [], isLoading } = useItems(selectedCatId, search, true);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [variationItem, setVariationItem] = useState<Item | null>(null);

  // Compute KPI statistics
  const stats = useMemo(() => {
    const total = rawItems.length;
    const active = rawItems.filter((i) => i.active).length;
    const withVariations = rawItems.filter((i) => i.variationMode !== "NONE").length;
    const outOfStock = rawItems.filter((i) => i.stockEnabled && i.stockQuantity <= 0).length;
    const lowStock = rawItems.filter((i) => i.stockEnabled && i.stockQuantity > 0 && i.stockQuantity <= 5).length;

    return { total, active, withVariations, outOfStock, lowStock };
  }, [rawItems]);

  // Client-side filtering for variation mode & status
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      if (variationFilter !== "ALL" && item.variationMode !== variationFilter) return false;
      if (statusFilter === "ACTIVE" && !item.active) return false;
      if (statusFilter === "INACTIVE" && item.active) return false;
      if (statusFilter === "OUT_OF_STOCK" && (!item.stockEnabled || item.stockQuantity > 0)) return false;
      return true;
    });
  }, [rawItems, variationFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [selectedCatId, search, variationFilter, statusFilter]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  const openAddModal = () => {
    setEditingItem(null);
    setIsProductModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (formData: FormData, editingItemId?: string) => {
    if (editingItemId) {
      await api.patch(`/items/${editingItemId}`, formData, true);
    } else {
      await api.post("/items", formData, true);
    }
    queryClient.invalidateQueries({ queryKey: ["items"] });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t.products.deleteConfirm)) return;
    try {
      await api.delete(`/items/${id}`);
      queryClient.invalidateQueries({ queryKey: ["items"] });
    } catch (err: any) {
      alert("Failed to delete product: " + err.message);
    }
  };

  const handleToggleStatus = async (item: Item) => {
    try {
      await api.patch(`/items/${item.id}/status`, { active: !item.active });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    } catch (err: any) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const handleOpenVariations = async (item: Item) => {
    const full = await api.get<Item>(`/items/${item.id}`);
    setVariationItem(full);
  };

  const handleRefreshVariations = async () => {
    if (variationItem) {
      const full = await api.get<Item>(`/items/${variationItem.id}`);
      setVariationItem(full);
      queryClient.invalidateQueries({ queryKey: ["items"] });
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 min-h-full pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-warmgray-900 dark:text-white tracking-tight">
            {t.products.title}
          </h1>
          <p className="text-xs sm:text-sm text-warmgray-600 dark:text-warmgray-400 mt-1 font-medium">
            Manage specialty coffee catalog, prices, recipes, and option variations
          </p>
        </div>

        {!isGuest && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/30 transition active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t.products.addProduct}</span>
          </button>
        )}
      </div>

      {/* Executive KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-xl p-5 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-400">Total Catalog Items</p>
            <p className="text-2xl font-black text-warmgray-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Active Items */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-xl p-5 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-400">Active for Sale</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.active}
            </p>
          </div>
        </div>

        {/* With Variations */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-xl p-5 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-400">Customizable Items</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              {stats.withVariations}
            </p>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-xl p-5 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-warmgray-700 dark:text-warmgray-400">Out of Stock</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-0.5">
              {stats.outOfStock}
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCatId("all")}
          className={`px-4 py-2 rounded-lg text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 ${
            selectedCatId === "all"
              ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
              : "bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-50 dark:hover:bg-warmgray-800"
          }`}
        >
          <span>All Categories</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCatId === cat.id;
          const catName = lang === "ar" ? cat.nameAr : cat.nameEn;
          const count = cat._count?.items ?? (cat.items ? cat.items.length : undefined);

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                isSelected
                  ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
                  : "bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-50 dark:hover:bg-warmgray-800"
              }`}
            >
              <span>{catName}</span>
              {count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-warmgray-200 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 font-bold"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Toolbars Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-500 dark:text-warmgray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or barcode..."
            className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 shadow-sm"
          />
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Variation Filter */}
          <select
            value={variationFilter}
            onChange={(e) => setVariationFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-lg text-xs font-bold text-warmgray-700 dark:text-warmgray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          >
            <option value="ALL">All Modes</option>
            <option value="NONE">Standard</option>
            <option value="OPTION">Options Group</option>
            <option value="VARIANT">Matrix Variant</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-lg text-xs font-bold text-warmgray-700 dark:text-warmgray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          {/* Grid vs Table View Switcher */}
          <div className="flex items-center bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-xl transition ${
                viewMode === "grid"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-warmgray-500 hover:text-warmgray-800 dark:text-warmgray-400 dark:hover:text-warmgray-200"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "table"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-warmgray-500 hover:text-warmgray-800 dark:text-warmgray-400 dark:hover:text-warmgray-200"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Content (List or Grid) */}
      <ProductList
        items={paginatedItems}
        isLoading={isLoading}
        viewMode={viewMode}
        onEdit={openEditModal}
        onDelete={handleDeleteProduct}
        onToggleStatus={handleToggleStatus}
        onOpenVariations={handleOpenVariations}
      />

      {/* Pagination Controls */}
      {filteredItems.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-warmgray-200 dark:border-warmgray-800 shadow-xs">
          <Pagination
            currentPage={page}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[10, 15, 25, 50]}
            className="border-t-0"
          />
        </div>
      )}

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        editingItem={editingItem}
        categories={categories}
      />

      {/* Variation Builder & Cartesian Generator Modal */}
      <VariationBuilderModal
        item={variationItem}
        onClose={() => setVariationItem(null)}
        onRefresh={handleRefreshVariations}
      />
    </div>
  );
}