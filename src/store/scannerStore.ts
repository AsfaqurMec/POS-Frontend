import { create } from "zustand";

export type ScannerMode = "PRODUCT" | "INVOICE";

interface ScannerState {
  isOpen: boolean;
  mode: ScannerMode;
  openScanner: (mode?: ScannerMode) => void;
  closeScanner: () => void;
  setMode: (mode: ScannerMode) => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  isOpen: false,
  mode: "PRODUCT",
  openScanner: (mode) =>
    set((state) => ({
      isOpen: true,
      mode: mode || state.mode,
    })),
  closeScanner: () => set({ isOpen: false }),
  setMode: (mode) => set({ mode }),
}));
