import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Business,
  Category,
  Item,
  Sale,
  User,
  UserWithStats,
  UserDetail,
  InventoryItem,
  DashboardStats,
  StockMovementsResponse,
  ProductStatsResponse,
  Shift,
  CashMovement,
  ShiftRunningStats,
  ShiftReport,
  HeldOrder,
  Ingredient,
  WasteLog,
  KdsOrder,
} from "@/types";

export function useBusiness() {
  return useQuery<Business>({
    queryKey: ["business"],
    queryFn: () => api.get<Business>("/business"),
  });
}

export function useCategories(includeInactive = false) {
  return useQuery<Category[]>({
    queryKey: ["categories", includeInactive],
    queryFn: () => api.get<Category[]>(`/categories?includeInactive=${includeInactive}`),
  });
}

export function useItems(categoryId?: string, search?: string, includeInactive = false) {
  return useQuery<Item[]>({
    queryKey: ["items", categoryId, search, includeInactive],
    queryFn: () => {
      const params = new URLSearchParams();
      if (categoryId && categoryId !== "all") params.append("categoryId", categoryId);
      if (search) params.append("search", search);
      if (includeInactive) params.append("includeInactive", "true");
      return api.get<Item[]>(`/items?${params.toString()}`);
    },
  });
}

export function useInventory(search?: string) {
  return useQuery<InventoryItem[]>({
    queryKey: ["inventory", search],
    queryFn: () => {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      return api.get<InventoryItem[]>(`/inventory${q}`);
    },
  });
}

export interface SalesFilters {
  search?: string;
  orderType?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
}

export function useSales(page = 1, limit = 50, filters?: SalesFilters) {
  return useQuery<{ sales: Sale[]; total: number }>({
    queryKey: ["sales", page, limit, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (filters?.search) params.append("search", filters.search);
      if (filters?.orderType && filters.orderType !== "ALL") params.append("orderType", filters.orderType);
      if (filters?.paymentMethod && filters.paymentMethod !== "ALL") params.append("paymentMethod", filters.paymentMethod);
      if (filters?.startDate) params.append("startDate", filters.startDate);
      if (filters?.endDate) params.append("endDate", filters.endDate);
      if (filters?.sortBy) params.append("sortBy", filters.sortBy);
      return api.get<{ sales: Sale[]; total: number }>(`/sales?${params.toString()}`);
    },
  });
}

export function useUsers() {
  return useQuery<UserWithStats[]>({
    queryKey: ["users"],
    queryFn: () => api.get<UserWithStats[]>("/users"),
  });
}

export function useUser(id?: string) {
  return useQuery<UserDetail>({
    queryKey: ["user", id],
    queryFn: () => api.get<UserDetail>(`/users/${id}`),
    enabled: Boolean(id),
  });
}

export interface StockMovementQueryFilters {
  itemId?: string;
  variantId?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useStockMovements(filters: StockMovementQueryFilters = {}) {
  return useQuery<StockMovementsResponse>({
    queryKey: ["stock-movements", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.itemId && filters.itemId !== "ALL") params.append("itemId", filters.itemId);
      if (filters.variantId && filters.variantId !== "ALL") params.append("variantId", filters.variantId);
      if (filters.type && filters.type !== "ALL") params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      return api.get<StockMovementsResponse>(`/stock-movements?${params.toString()}`);
    },
  });
}

export function useDashboardStats(period = "7days", startDate?: string, endDate?: string) {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", period, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append("period", period);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      return api.get<DashboardStats>(`/dashboard/stats?${params.toString()}`);
    },
    refetchInterval: 30000,
  });
}

export function useProductStats(itemId?: string) {
  return useQuery<ProductStatsResponse>({
    queryKey: ["product-stats", itemId],
    queryFn: () => api.get<ProductStatsResponse>(`/items/${itemId}/stats`),
    enabled: Boolean(itemId),
  });
}

// ----------------- SHIFTS & CASH MANAGEMENT -----------------
export function useCurrentShift() {
  return useQuery<{ shift: Shift; runningStats: ShiftRunningStats } | null>({
    queryKey: ["current-shift"],
    queryFn: () => api.get<{ shift: Shift; runningStats: ShiftRunningStats } | null>("/shifts/current"),
    refetchInterval: 15000,
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (startFloat: number) => api.post<Shift>("/shifts/open", { startFloat }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-shift"] });
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { shiftId: string; actualCash: number; notes?: string }) =>
      api.post<{ shift: Shift; report: ShiftReport }>("/shifts/close", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-shift"] });
    },
  });
}

export function useAddCashMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { shiftId: string; type: "PAID_IN" | "PAID_OUT" | "CASH_DROP"; amount: number; reason: string }) =>
      api.post<CashMovement>("/shifts/cash-movement", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-shift"] });
    },
  });
}

export function useShiftReport(shiftId?: string) {
  return useQuery<ShiftReport>({
    queryKey: ["shift-report", shiftId],
    queryFn: () => api.get<ShiftReport>(`/shifts/${shiftId}/report`),
    enabled: Boolean(shiftId),
  });
}

// ----------------- HELD ORDERS (PARK / RECALL) -----------------
export function useHeldOrders() {
  return useQuery<HeldOrder[]>({
    queryKey: ["held-orders"],
    queryFn: () => api.get<HeldOrder[]>("/sales/held"),
    refetchInterval: 10000,
  });
}

export function useHoldOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      customerName?: string;
      customerPhone?: string;
      tag?: string;
      orderType?: string;
      cartSnapshot: string;
      itemCount: number;
      subtotal: number;
    }) => api.post<HeldOrder>("/sales/hold", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["held-orders"] });
    },
  });
}

export function useDeleteHeldOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sales/held/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["held-orders"] });
    },
  });
}

// ----------------- VOIDS & REFUNDS -----------------
export function useVoidSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { saleId: string; voidReason: string; restock?: boolean }) =>
      api.post(`/sales/${data.saleId}/void`, { voidReason: data.voidReason, restock: data.restock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

// ----------------- INGREDIENTS & RECIPES -----------------
export function useIngredients() {
  return useQuery<Ingredient[]>({
    queryKey: ["ingredients"],
    queryFn: () => api.get<Ingredient[]>("/recipes/ingredients"),
  });
}

export function useLogWastage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { ingredientId?: string; itemId?: string; quantity: number; reason: string; notes?: string }) =>
      api.post<WasteLog>("/recipes/waste", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["waste-logs"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useWasteLogs(limit = 50, page = 1) {
  return useQuery<{
    logs: WasteLog[];
    total: number;
    page: number;
    limit: number;
    totalCostLost: number;
    totalQuantityWasted: number;
  }>({
    queryKey: ["waste-logs", limit, page],
    queryFn: () => api.get(`/recipes/waste?limit=${limit}&page=${page}`),
  });
}

// ----------------- KDS (KITCHEN DISPLAY SYSTEM) -----------------
export function useKdsOrders(station = "ALL") {
  return useQuery<KdsOrder[]>({
    queryKey: ["kds-orders", station],
    queryFn: () => api.get<KdsOrder[]>(`/kds/orders?station=${station}`),
    refetchInterval: 5000,
  });
}

export function useUpdateKdsStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { saleId: string; status: string }) =>
      api.patch(`/kds/orders/${data.saleId}/status`, { status: data.status }),
    onMutate: async ({ saleId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["kds-orders"] });
      const previousQueries = queryClient.getQueriesData<KdsOrder[]>({ queryKey: ["kds-orders"] });

      queryClient.setQueriesData<KdsOrder[]>({ queryKey: ["kds-orders"] }, (old) => {
        if (!old) return old;
        return old.map((order) =>
          order.id === saleId ? { ...order, status: status as any } : order
        );
      });

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
    },
  });
}