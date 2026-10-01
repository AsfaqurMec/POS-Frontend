import { API_BASE_URL } from "./env";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("pos_token");
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    // Security Gate: Block API calls if terminal is locked (except unlock and auth endpoints)
    if (typeof window !== "undefined") {
      const isLocked = localStorage.getItem("pos_terminal_locked") === "true";
      const allowedLockedPaths = [
        "/auth/unlock-terminal",
        "/auth/verify-manager-pin",
        "/auth/logout",
        "/auth/login",
        "/auth/pin-login",
        "/auth/guest-login",
      ];
      const isAllowed = allowedLockedPaths.some((p) => path.startsWith(p));
      if (isLocked && !isAllowed) {
        const err = new Error("Terminal is locked. Please unlock the terminal to perform actions.") as any;
        err.code = "TERMINAL_LOCKED";
        err.status = 423; // Locked
        throw err;
      }
    }

    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Auto-Logout if token is expired, invalid, or revoked
      if (
        response.status === 401 &&
        !path.includes("/auth/login") &&
        !path.includes("/auth/unlock-terminal") &&
        !path.includes("/auth/pin-login")
      ) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("pos_token");
          localStorage.removeItem("pos_user");
          localStorage.removeItem("pos_terminal_locked");
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
      }

      const errorMsg = data?.error?.message || "An unexpected error occurred";
      const errorCode = data?.error?.code || "REQUEST_FAILED";
      const err = new Error(errorMsg) as any;
      err.code = errorCode;
      err.status = response.status;
      throw err;
    }

    return data.data !== undefined ? data.data : data;
  }

  get<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, body?: any, isFormData = false) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: any, isFormData = false) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient();