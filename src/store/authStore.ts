import { create } from "zustand";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (user: User, token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pos_token", token);
      localStorage.setItem("pos_user", JSON.stringify(user));
    }
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pos_token");
      localStorage.removeItem("pos_user");
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  initAuth: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("pos_token");
      const userStr = localStorage.getItem("pos_user");
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ user, token, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          // ignore corrupted data
        }
      }
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));