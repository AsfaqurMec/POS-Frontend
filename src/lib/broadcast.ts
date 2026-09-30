/**
 * Real-time BroadcastChannel for Customer Facing Display (CFD)
 * Allows zero-latency, offline-capable synchronization between the Cashier POS window
 * and a secondary monitor or tablet facing the customer.
 */

export interface CfdCartItemOption {
  groupId?: string;
  groupNameEn?: string;
  groupNameAr?: string;
  optionId?: string;
  optionNameEn: string;
  optionNameAr?: string;
  priceAdjustment: number;
}

export interface CfdCartItem {
  id: string;
  nameEn: string;
  nameAr: string;
  imageUrl?: string | null;
  quantity: number;
  basePrice?: number;
  unitPrice: number;
  lineTotal: number;
  optionsSummary?: string;
  selectedOptions?: CfdCartItemOption[];
}

export interface CfdBroadcastMessage {
  type: "CART_UPDATE" | "SALE_SUCCESS" | "CART_CLEAR" | "REQUEST_SYNC";
  payload?: {
    items?: CfdCartItem[];
    subtotal?: number;
    discount?: number;
    tax?: number;
    total?: number;
    currency?: string;
    orderType?: string;
    orderNumber?: string;
    invoiceNumber?: string;
    cashierName?: string;
    paymentMethod?: string;
  };
}

class CfdChannel {
  private channel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel("pos_customer_display");
    }
  }

  send(msg: CfdBroadcastMessage) {
    try {
      this.channel?.postMessage(msg);
    } catch (err) {
      console.warn("Failed to broadcast to CFD:", err);
    }
  }

  listen(callback: (msg: CfdBroadcastMessage) => void) {
    if (!this.channel) return () => {};

    const handler = (event: MessageEvent<CfdBroadcastMessage>) => {
      callback(event.data);
    };

    this.channel.addEventListener("message", handler);
    return () => {
      this.channel?.removeEventListener("message", handler);
    };
  }
}

export const cfdChannel = new CfdChannel();
