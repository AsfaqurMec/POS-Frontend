export type Role = "ADMIN" | "STAFF" | "GUEST";
export type Status = "ACTIVE" | "INACTIVE";
export type VariationMode = "NONE" | "OPTION" | "VARIANT";
export type SelectionType = "SINGLE" | "MULTIPLE";
export type PaymentMethod = "CASH" | "CARD" | "MOBILE_PAY" | "SPLIT" | "LOYALTY" | "OTHER";
export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  hasPin?: boolean;
  pinCode?: string | null;
  createdAt: string;
}

export interface Business {
  id: string;
  nameEn: string;
  nameAr: string;
  logoUrl?: string | null;
  phone?: string | null;
  addressEn?: string | null;
  addressAr?: string | null;
  currency: string;
  timezone: string;
  taxEnabled: boolean;
  taxRate: number;
  pricingMode: "INCLUSIVE" | "EXCLUSIVE";
  invoicePrefix: string;
  receiptFooterEn?: string | null;
  receiptFooterAr?: string | null;
}

export interface Category {
  id: string;
  businessId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  imageUrl?: string | null;
  active: boolean;
  sortOrder: number;
  _count?: { items: number };
  items?: Item[];
}

export interface VariationOption {
  id: string;
  variationGroupId: string;
  nameEn: string;
  nameAr: string;
  priceAdjustment: number;
  active: boolean;
  sortOrder: number;
}

export interface VariationGroup {
  id: string;
  itemId: string;
  nameEn: string;
  nameAr: string;
  required: boolean;
  selectionType: SelectionType;
  sortOrder: number;
  active: boolean;
  options: VariationOption[];
}

export interface ProductVariantOption {
  id: string;
  productVariantId: string;
  variationGroupId: string;
  variationOptionId: string;
  variationGroup: VariationGroup;
  variationOption: VariationOption;
}

export interface ProductVariant {
  id: string;
  itemId: string;
  sku?: string | null;
  barcode?: string | null;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
  active: boolean;
  variantOptions: ProductVariantOption[];
}

export interface Item {
  id: string;
  businessId: string;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  imageUrl?: string | null;
  type: "PRODUCT" | "SERVICE";
  basePrice: number;
  sku?: string | null;
  barcode?: string | null;
  stockEnabled: boolean;
  stockQuantity: number;
  variationMode: VariationMode;
  active: boolean;
  category?: Category;
  variationGroups: VariationGroup[];
  variants: ProductVariant[];
}

export interface CartItemOption {
  groupId: string;
  groupNameEn: string;
  groupNameAr: string;
  optionId: string;
  optionNameEn: string;
  optionNameAr: string;
  priceAdjustment: number;
}

export interface CartItem {
  cartItemId: string; // unique key in cart
  item: Item;
  variant?: ProductVariant | null;
  quantity: number;
  baseUnitPrice: number;
  selectedOptions: CartItemOption[];
  unitPrice: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  saleId: string;
  invoiceNumber: string;
  issueDate: string;
  issueTime: string;
  cashierName?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  orderType?: "TAKEAWAY" | "DINE_IN" | "DELIVERY";
  businessNameEn: string;
  businessNameAr: string;
  businessAddressEn?: string | null;
  businessAddressAr?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: "ISSUED" | "VOID";
  createdAt: string;
}

export interface SaleItemOption {
  id: string;
  variationGroupNameEn: string;
  variationGroupNameAr: string;
  optionNameEn: string;
  optionNameAr: string;
  priceAdjustment: number;
}

export interface SaleItem {
  id: string;
  saleId: string;
  itemId: string;
  variantId?: string | null;
  itemNameEnSnapshot: string;
  itemNameArSnapshot: string;
  quantity: number;
  baseUnitPrice: number;
  variationAmount: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  options: SaleItemOption[];
  item?: Item;
  variant?: ProductVariant | null;
}

export interface Sale {
  id: string;
  businessId: string;
  userId: string;
  orderNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  orderType: "TAKEAWAY" | "DINE_IN" | "DELIVERY";
  status: "COMPLETED" | "CANCELLED" | "PENDING";
  createdAt: string;
  user?: { id: string; name: string; email: string; role?: string };
  invoice?: Invoice;
  items: SaleItem[];
}

export interface SaleResponse {
  sale: Sale;
  invoice: Invoice;
  business: {
    nameEn: string;
    nameAr: string;
    logoUrl?: string | null;
    phone?: string;
    addressEn?: string;
    addressAr?: string;
    currency: string;
    receiptFooterEn?: string;
    receiptFooterAr?: string;
    taxEnabled?: boolean;
    taxRate?: number;
    pricingMode?: "INCLUSIVE" | "EXCLUSIVE";
  };
}

export interface UserWithStats extends User {
  totalSales?: number;
  totalRevenue?: number;
}

export interface UserDetailStats {
  totalSalesCount: number;
  totalRevenue: number;
  avgOrderValue: number;
  todaySalesCount: number;
  todayRevenue: number;
  orderTypeBreakdown: {
    DINE_IN: number;
    TAKEAWAY: number;
    DELIVERY: number;
  };
  paymentMethodBreakdown: Record<string, { count: number; total: number }>;
}

export interface UserRecentSale {
  id: string;
  invoiceNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  orderType: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  createdAt: string;
  updatedAt: string;
  stats: UserDetailStats;
  recentSales: UserRecentSale[];
}

export interface InventoryItem {
  id: string;
  type: "ITEM" | "VARIANT";
  itemId: string;
  nameEn: string;
  nameAr: string;
  categoryId: string;
  categoryEn: string;
  categoryAr: string;
  imageUrl?: string | null;
  basePrice: number;
  sku: string;
  barcode: string;
  stockQuantity: number;
  status: "OUT_OF_STOCK" | "LOW" | "IN_STOCK";
  valuation: number;
  active: boolean;
}

export interface StockMovement {
  id: string;
  itemId: string;
  variantId?: string | null;
  type: "RESTOCK" | "SALE" | "RETURN" | "DAMAGE" | "ADJUSTMENT";
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string | null;
  reason?: string | null;
  userId?: string | null;
  createdAt: string;
  item: {
    id: string;
    nameEn: string;
    nameAr: string;
    imageUrl?: string | null;
    sku?: string | null;
    barcode?: string | null;
    basePrice?: number;
    stockQuantity?: number;
    category?: { id: string; nameEn: string; nameAr: string };
  };
  variant?: {
    id: string;
    price: number;
    sku?: string | null;
    barcode?: string | null;
    variantOptions?: {
      variationGroup: { nameEn: string; nameAr: string };
      variationOption: { nameEn: string; nameAr: string };
    }[];
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
}

export interface StockMovementsResponse {
  movements: StockMovement[];
  total: number;
  page: number;
  limit: number;
  stats: {
    totalMovements: number;
    totalInflow: number;
    totalOutflow: number;
    netChange: number;
    todayCount: number;
  };
}

export interface DashboardKPIs {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  averageOrderValue: number;
  totalUnitsSold: number;
  estimatedGrossProfit: number;
  totalDiscountGiven: number;
  totalTaxCollected: number;
  totalCatalogItems: number;
  totalStockValuation: number;
  totalUnitsInStock: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface CurvePoint {
  label: string;
  revenue: number;
  orders: number;
  units: number;
  timestamp: string;
}

export interface HourlyDistributionPoint {
  hour: string;
  count: number;
  total: number;
}

export interface PaymentBreakdownItem {
  method: string;
  count: number;
  total: number;
  percentage: number;
}

export interface OrderTypeBreakdownItem {
  type: string;
  count: number;
  total: number;
  percentage: number;
}

export interface TopProductItem {
  rank: number;
  itemId: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string | null;
  categoryNameEn: string;
  categoryNameAr: string;
  unitsSold: number;
  revenue: number;
  share: number;
}

export interface CategoryBreakdownItem {
  id: string;
  nameEn: string;
  nameAr: string;
  revenue: number;
  unitsSold: number;
  percentage: number;
}

export interface CriticalStockAlert {
  id: string;
  nameEn: string;
  nameAr: string;
  imageUrl?: string | null;
  categoryName: string;
  stockQuantity: number;
  status: "OUT_OF_STOCK" | "LOW";
}

export interface DashboardStats {
  period: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  kpis: DashboardKPIs;
  salesCurves: CurvePoint[];
  hourlyDistribution: HourlyDistributionPoint[];
  paymentBreakdown: PaymentBreakdownItem[];
  orderTypeBreakdown: OrderTypeBreakdownItem[];
  topSellingProducts: TopProductItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  criticalStockAlerts: CriticalStockAlert[];
  recentActivity: {
    sales: {
      id: string;
      orderNumber?: string;
      invoiceNumber: string;
      customerName: string;
      totalAmount: number;
      paymentMethod: string;
      orderType: string;
      itemsCount?: number;
      cashierName: string;
      createdAt: string;
    }[];
    stockMovements: StockMovement[];
  };
}

export interface ProductStatsResponse {
  item: Item;
  stats: {
    totalSoldUnits: number;
    totalRevenue: number;
    totalRestocked: number;
    totalDamaged: number;
    totalAdjusted: number;
    currentStock: number;
    currentValuation: number;
    movementsCount: number;
    salesCount: number;
  };
  recentMovements: StockMovement[];
  recentSales: {
    id: string;
    saleId: string;
    invoiceNumber: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    paymentMethod: string;
    orderType: string;
    cashierName: string;
    date: string;
  }[];
}

// Enterprise POS Additions
export interface Shift {
  id: string;
  businessId: string;
  userId: string;
  openedAt: string;
  closedAt?: string | null;
  startFloat: number;
  expectedCash?: number | null;
  actualCash?: number | null;
  cashVariance?: number | null;
  notes?: string | null;
  status: "OPEN" | "CLOSED";
  user: { id: string; name: string; email: string; role: Role };
  cashMovements?: CashMovement[];
}

export interface CashMovement {
  id: string;
  shiftId: string;
  userId: string;
  type: "PAID_IN" | "PAID_OUT" | "CASH_DROP";
  amount: number;
  reason: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface ShiftRunningStats {
  totalOrders: number;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
  totalDiscount: number;
  totalTax: number;
  paidIns: number;
  paidOuts: number;
  expectedCashInDrawer: number;
}

export interface ShiftReport {
  business: Business;
  shift: {
    id: string;
    status: "OPEN" | "CLOSED";
    openedAt: string;
    closedAt?: string | null;
    cashierName: string;
    cashierRole: Role;
    startFloat: number;
    expectedCash: number;
    actualCash: number;
    cashVariance: number;
    notes?: string | null;
  };
  summary: {
    totalOrders: number;
    firstInvoice: string;
    lastInvoice: string;
    subtotal: number;
    totalDiscounts: number;
    totalTax: number;
    totalRevenue: number;
    tenders: {
      cash: number;
      card: number;
      other: number;
    };
    cashReconciliation: {
      startFloat: number;
      cashSales: number;
      paidIns: number;
      paidOuts: number;
      expectedInDrawer: number;
      actualCounted: number;
      overShort: number;
    };
  };
  cashMovements: CashMovement[];
}

export interface HeldOrder {
  id: string;
  businessId: string;
  userId: string;
  orderNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  tag?: string | null;
  orderType: string;
  cartSnapshot: string;
  itemCount: number;
  subtotal: number;
  createdAt: string;
}

export interface SplitPayment {
  paymentMethod: "CASH" | "CARD" | "MOBILE_PAY" | "OTHER";
  amount: number;
  reference?: string;
}

export interface Ingredient {
  id: string;
  businessId: string;
  nameEn: string;
  nameAr: string;
  unit: string;
  costPerUnit: number;
  currentStock: number;
  reorderLevel: number;
  isLowStock?: boolean;
  stockValuation?: number;
  recipes?: {
    itemId: string;
    quantityRequired: number;
    item: { id: string; nameEn: string; nameAr: string };
  }[];
}

export interface WasteLog {
  id: string;
  businessId: string;
  ingredientId?: string | null;
  itemId?: string | null;
  quantity: number;
  cost: number;
  reason: "DIAL_IN" | "SPOILAGE" | "SPILLAGE" | "EXPIRED" | "DEFECTIVE" | string;
  notes?: string | null;
  userId?: string | null;
  createdAt: string;
  ingredient?: Ingredient | null;
  item?: { id: string; nameEn: string; nameAr: string } | null;
}

export interface KdsOrder {
  id: string;
  orderNumber?: string | null;
  orderType: "TAKEAWAY" | "DINE_IN" | "DELIVERY";
  status: "PENDING" | "PREPARING" | "READY" | "SERVED" | "COMPLETED";
  createdAt: string;
  customerName?: string | null;
  user: { name: string };
  invoice?: { invoiceNumber: string };
  items: {
    id: string;
    itemNameEnSnapshot: string;
    itemNameArSnapshot: string;
    quantity: number;
    options: { optionNameEn: string; optionNameAr: string }[];
    item: {
      category: { nameEn: string; nameAr: string };
    };
    variant?: {
      variantOptions: {
        variationOption: { nameEn: string; nameAr: string };
      }[];
    };
  }[];
}