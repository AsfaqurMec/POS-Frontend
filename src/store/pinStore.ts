import { create } from "zustand";

interface PinState {
  isLocked: boolean;
  lockReason: string | null;
  isManagerModalOpen: boolean;
  managerActionTitle: string;
  onManagerSuccess: (() => void) | null;

  // Actions
  initLockState: () => void;
  lockTerminal: (reason?: string) => void;
  unlockTerminal: () => void;
  requestManagerApproval: (actionTitle: string, onSuccess: () => void) => void;
  closeManagerModal: () => void;
}

export const usePinStore = create<PinState>((set) => ({
  isLocked: false,
  lockReason: null,
  isManagerModalOpen: false,
  managerActionTitle: "",
  onManagerSuccess: null,

  initLockState: () => {
    if (typeof window !== "undefined") {
      const savedLocked = localStorage.getItem("pos_terminal_locked") === "true";
      const savedReason = localStorage.getItem("pos_lock_reason");
      if (savedLocked) {
        set({ isLocked: true, lockReason: savedReason || "Terminal Locked" });
      }
    }
  },

  lockTerminal: (reason = "Terminal Locked") => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("pos_terminal_locked", "true");
        localStorage.setItem("pos_lock_reason", reason);
      } catch (e) {
        console.warn("Failed to persist lock state:", e);
      }
    }
    set({ isLocked: true, lockReason: reason });
  },

  unlockTerminal: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("pos_terminal_locked");
        localStorage.removeItem("pos_lock_reason");
      } catch (e) {
        console.warn("Failed to clear lock state:", e);
      }
    }
    set({ isLocked: false, lockReason: null });
  },

  requestManagerApproval: (actionTitle, onSuccess) => {
    set({
      isManagerModalOpen: true,
      managerActionTitle: actionTitle,
      onManagerSuccess: onSuccess,
    });
  },

  closeManagerModal: () => {
    set({
      isManagerModalOpen: false,
      managerActionTitle: "",
      onManagerSuccess: null,
    });
  },
}));
