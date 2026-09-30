"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useLangStore } from "@/store/langStore";

interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages: propTotalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50],
  className = "",
}) => {
  const { dir } = useLangStore();
  const isRTL = dir === "rtl";

  const totalPages = propTotalPages ?? (Math.ceil(totalItems / pageSize) || 1);

  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  const FirstIcon = isRTL ? ChevronsRight : ChevronsLeft;
  const LastIcon = isRTL ? ChevronsLeft : ChevronsRight;

  return (
    <div
      className={`px-4 py-3 bg-white dark:bg-warmgray-900 border-t border-warmgray-200 dark:border-warmgray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs select-none ${className}`}
    >
      {/* Items count & page size selector */}
      <div className="flex items-center gap-3 text-warmgray-700 dark:text-warmgray-300 font-medium">
        <span>
          Showing <strong className="text-warmgray-900 dark:text-white font-bold">{startItem}</strong> to{" "}
          <strong className="text-warmgray-900 dark:text-white font-bold">{endItem}</strong> of{" "}
          <strong className="text-warmgray-900 dark:text-white font-bold">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-1.5 ms-2">
            <span className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-bold">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-warmgray-50 dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-lg px-2.5 py-1 text-xs font-bold text-warmgray-800 dark:text-warmgray-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 self-center sm:self-auto">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-700 transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
            title="First Page"
          >
            <FirstIcon className="w-3.5 h-3.5" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-700 transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
            title="Previous Page"
          >
            <PrevIcon className="w-3.5 h-3.5" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-warmgray-500 dark:text-warmgray-400 font-bold"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = p === currentPage;
              return (
                <button
                  key={`page-${p}`}
                  onClick={() => onPageChange(Number(p))}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    isCurrent
                      ? "bg-amber-600 text-white shadow-xs font-black"
                      : "border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-700"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-700 transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
            title="Next Page"
          >
            <NextIcon className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-700 transition flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none shadow-2xs"
            title="Last Page"
          >
            <LastIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
