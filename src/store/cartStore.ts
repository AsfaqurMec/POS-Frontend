import { create } from "zustand";
import { CartItem, CartItemOption, DiscountType, Item, PaymentMethod, ProductVariant } from "@/types";

interface CartState {
  items: CartItem[];
  discountType: DiscountType;
  discountValue: number;
  paymentMethod: PaymentMethod;
  orderType: "TAKEAWAY" | "DINE_IN" | "DELIVERY";
  customerName: string;
  customerPhone: string;
  isSubmitting: boolean;

  // Actions
  addToCart: (item: Item, variant: ProductVariant | null, options: CartItemOption[], quantity?: number) => void;
  updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  updateCartItem: (cartItemId: string, options: CartItemOption[], quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  setDiscount: (type: DiscountType, value: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setOrderType: (type: "TAKEAWAY" | "DINE_IN" | "DELIVERY") => void;
  setCustomerInfo: (name: string, phone: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  clearCart: () => void;

  // Computed helpers
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotalAmount: (taxEnabled?: boolean, taxRate?: number, pricingMode?: string) => number;
  getItemsCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discountType: "NONE",
  discountValue: 0,
  paymentMethod: "CASH",
  orderType: "TAKEAWAY",
  customerName: "",
  customerPhone: "",
  isSubmitting: false,

  addToCart: (item, variant, options, quantity = 1) => {
    const qty = Math.max(1, quantity);

    // Calculate unit price: variant price OR base + options
    let baseUnitPrice = item.basePrice;
    let unitPrice = item.basePrice;
    if (item.variationMode === "VARIANT" && variant) {
      baseUnitPrice = variant.price;
      unitPrice = variant.price;
    } else {
      baseUnitPrice = item.basePrice;
      const optionsSum = options.reduce((sum, opt) => sum + opt.priceAdjustment, 0);
      unitPrice = item.basePrice + optionsSum;
    }

    // Generate unique signature for this configuration
    const optionSignature = options
      .map((o) => o.optionId)
      .sort()
      .join("|");
    const signature = `${item.id}_${variant?.id || "none"}_${optionSignature}`;

    const items = get().items;
    const existingIndex = items.findIndex((i) => i.cartItemId === signature);

    if (existingIndex > -1) {
      // Merge quantity
      const updated = [...items];
      const newQty = updated[existingIndex].quantity + qty;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        lineTotal: unitPrice * newQty,
      };
      set({ items: updated });
    } else {
      // Add new line
      const newItem: CartItem = {
        cartItemId: signature,
        item,
        variant,
        quantity: qty,
        baseUnitPrice,
        selectedOptions: options,
        unitPrice,
        lineTotal: unitPrice * qty,
      };
      set({ items: [...items, newItem] });
    }
  },

  updateCartItemQuantity: (cartItemId, delta) => {
    const items = get().items;
    const updated = items
      .map((item) => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            lineTotal: item.unitPrice * newQty,
          };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    set({ items: updated });
  },

  updateCartItem: (cartItemId, options, quantity) => {
    const items = get().items;
    const target = items.find((i) => i.cartItemId === cartItemId);
    if (!target) return;

    // Remove old item and add updated
    const filtered = items.filter((i) => i.cartItemId !== cartItemId);
    set({ items: filtered });
    get().addToCart(target.item, target.variant || null, options, quantity);
  },

  removeFromCart: (cartItemId) => {
    set({ items: get().items.filter((i) => i.cartItemId !== cartItemId) });
  },

  setDiscount: (type, value) => {
    set({ discountType: type, discountValue: Math.max(0, value) });
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
  },

  setOrderType: (type) => {
    set({ orderType: type });
  },

  setCustomerInfo: (name, phone) => {
    set({ customerName: name, customerPhone: phone });
  },

  setIsSubmitting: (submitting) => {
    set({ isSubmitting: submitting });
  },

  clearCart: () => {
    set({
      items: [],
      discountType: "NONE",
      discountValue: 0,
      paymentMethod: "CASH",
      orderType: "TAKEAWAY",
      customerName: "",
      customerPhone: "",
      isSubmitting: false,
    });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, i) => sum + i.lineTotal, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const { discountType, discountValue } = get();

    if (discountType === "PERCENTAGE") {
      const pct = Math.min(100, Math.max(0, discountValue));
      return (subtotal * pct) / 100;
    }
    if (discountType === "FIXED") {
      return Math.min(subtotal, Math.max(0, discountValue));
    }
    return 0;
  },

  getTotalAmount: (taxEnabled = false, taxRate = 0, pricingMode = "INCLUSIVE") => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountAmount();
    const net = Math.max(0, subtotal - discount);

    if (taxEnabled && taxRate > 0 && pricingMode === "EXCLUSIVE") {
      const tax = (net * taxRate) / 100;
      return net + tax;
    }
    return net;
  },

  getItemsCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },
}));