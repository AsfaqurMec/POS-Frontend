/**
 * Offline Sales Queue & Synchronization Engine
 * Stores transactions locally when Wi-Fi is lost, and replays them automatically
 * once internet connectivity is restored.
 */

import { api } from "./api";

export interface OfflineQueuedSale {
  offlineId: string;
  payload: any;
  queuedAt: string;
  totalAmount: number;
}

const STORAGE_KEY = "pos_offline_sales_queue";

export class OfflineSyncManager {
  private isSyncing = false;

  getQueuedSales(): OfflineQueuedSale[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  queueSale(payload: any, totalAmount: number): string {
    const offlineId = `OFF-${Date.now().toString(36).toUpperCase()}`;
    const queuedSales = this.getQueuedSales();

    const newEntry: OfflineQueuedSale = {
      offlineId,
      payload,
      queuedAt: new Date().toISOString(),
      totalAmount,
    };

    queuedSales.push(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queuedSales));
    return offlineId;
  }

  async syncPendingSales(onSuccess?: (syncedCount: number) => void): Promise<number> {
    if (this.isSyncing) return 0;
    if (typeof navigator !== "undefined" && !navigator.onLine) return 0;

    const queued = this.getQueuedSales();
    if (queued.length === 0) return 0;

    this.isSyncing = true;
    let syncedCount = 0;
    const remaining: OfflineQueuedSale[] = [];

    for (const item of queued) {
      try {
        await api.post("/sales", item.payload);
        syncedCount++;
      } catch (err) {
        console.error(`Failed to sync offline sale ${item.offlineId}:`, err);
        remaining.push(item);
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    this.isSyncing = false;

    if (syncedCount > 0 && onSuccess) {
      onSuccess(syncedCount);
    }

    return syncedCount;
  }
}

export const offlineSync = new OfflineSyncManager();
