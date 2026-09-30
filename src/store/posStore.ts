import { create } from "zustand";
import { CartItem, Item, SaleResponse } from "@/types";

interface PosUIState {
  selectedCategoryId: string;
  searchQuery: string;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;

  // Modals
  activeProductForVariation: Item | null;
  editingCartItem: CartItem | null;
  isVariationModalOpen: boolean;

  lastCompletedSale: SaleResponse | null;
  isReceiptModalOpen: boolean;

  // Actions
  setSelectedCategoryId: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileDrawerOpen: (open: boolean) => void;

  openVariationModal: (item: Item, cartItemToEdit?: CartItem | null) => void;
  closeVariationModal: () => void;

  openReceiptModal: (saleResponse: SaleResponse) => void;
  closeReceiptModal: () => void;
}

export const usePosStore = create<PosUIState>((set) => ({
  selectedCategoryId: "all",
  searchQuery: "",
  sidebarCollapsed: false,
  mobileDrawerOpen: false,

  activeProductForVariation: null,
  editingCartItem: null,
  isVariationModalOpen: false,

  lastCompletedSale: null,
  isReceiptModalOpen: false,

  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

  openVariationModal: (item, cartItemToEdit = null) =>
    set({
      activeProductForVariation: item,
      editingCartItem: cartItemToEdit,
      isVariationModalOpen: true,
    }),

  closeVariationModal: () =>
    set({
      activeProductForVariation: null,
      editingCartItem: null,
      isVariationModalOpen: false,
    }),

  openReceiptModal: (saleResponse) =>
    set({
      lastCompletedSale: saleResponse,
      isReceiptModalOpen: true,
    }),

  closeReceiptModal: () =>
    set({
      lastCompletedSale: null,
      isReceiptModalOpen: false,
    }),
}));