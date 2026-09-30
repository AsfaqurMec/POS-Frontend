import { API_BASE_URL } from "./env";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("pos_token");
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
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