import { create } from "zustand";
import { User } from "@/types";
import { API_BASE_URL } from "@/lib/env";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
}

let storageAuthListenerInitialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
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
      localStorage.removeItem("pos_terminal_locked");
      localStorage.removeItem("pos_lock_reason");
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  initAuth: async () => {
    if (typeof window !== "undefined") {
      // Anti-Tamper: Detect unauthorized manipulation of auth tokens in DevTools storage
      if (!storageAuthListenerInitialized) {
        storageAuthListenerInitialized = true;
        window.addEventListener("storage", (e) => {
          if (e.key === "pos_token" || e.key === "pos_user") {
            const currentToken = localStorage.getItem("pos_token");
            if (!currentToken) {
              get().logout();
            } else {
              get().initAuth();
            }
          }
        });
      }

      const token = localStorage.getItem("pos_token");
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        // Authoritative verification against server endpoint
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          const serverUser: User = json.data || json;
          localStorage.setItem("pos_user", JSON.stringify(serverUser));
          set({ user: serverUser, token, isAuthenticated: true, isLoading: false });
          return;
        } else {
          // Token is invalid, expired, or tampered with
          get().logout();
          return;
        }
      } catch {
        // In case of offline/network glitch, check fallback user but prevent role spoofing
        const userStr = localStorage.getItem("pos_user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: true, isLoading: false });
            return;
          } catch {}
        }
        get().logout();
        return;
      }
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));