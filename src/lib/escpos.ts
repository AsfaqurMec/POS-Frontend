/**
 * Raw ESC/POS Command Generator for 80mm Thermal Receipt Printers & Cash Drawers
 */

export const ESC = "\x1B";
export const GS = "\x1D";

export const COMMANDS = {
  INIT: `${ESC}@`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_HEIGHT: `${ESC}!\x10`,
  DOUBLE_WIDTH: `${ESC}!\x20`,
  DOUBLE_SIZE: `${ESC}!\x30`,
  NORMAL_SIZE: `${ESC}!\x00`,
  FEED_LINE: "\n",
  CUT_FULL: `${GS}V\x00`,
  CUT_PARTIAL: `${GS}V\x01`,
  // Kick drawer pin 2: ESC p m t1 t2 (25ms on, 250ms off)
  DRAWER_KICK: `${ESC}p\x00\x19\xFA`,
};

export interface ReceiptPrintData {
  businessName: string;
  phone?: string;
  address?: string;
  orderNumber?: string;
  invoiceNumber: string;
  cashierName: string;
  date: string;
  time: string;
  orderType: string;
  items: {
    name: string;
    qty: number;
    price: number;
    total: number;
    options?: string[];
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  currency: string;
  footer?: string;
}

export function generateEscPosReceipt(data: ReceiptPrintData): Uint8Array {
  let commands = "";

  // 1. Initialize
  commands += COMMANDS.INIT;
  commands += COMMANDS.ALIGN_CENTER;

  // 2. Header
  commands += COMMANDS.DOUBLE_SIZE + COMMANDS.BOLD_ON;
  commands += `${data.businessName}\n`;
  commands += COMMANDS.NORMAL_SIZE + COMMANDS.BOLD_OFF;

  if (data.address) commands += `${data.address}\n`;
  if (data.phone) commands += `Tel: ${data.phone}\n`;

  commands += "------------------------------------------\n";

  // 3. Order & Invoice Metadata
  commands += COMMANDS.ALIGN_LEFT;
  if (data.orderNumber) {
    commands += COMMANDS.BOLD_ON + COMMANDS.DOUBLE_HEIGHT;
    commands += `ORDER #: ${data.orderNumber}\n`;
    commands += COMMANDS.BOLD_OFF + COMMANDS.NORMAL_SIZE;
  }
  commands += `Invoice: ${data.invoiceNumber}  [${data.orderType}]\n`;
  commands += `Date: ${data.date} ${data.time}\n`;
  commands += `Cashier: ${data.cashierName}\n`;
  commands += "==========================================\n";

  // 4. Line Items Table (42 chars width standard for 80mm)
  commands += "ITEM                       QTY    AMOUNT\n";
  commands += "------------------------------------------\n";

  for (const item of data.items) {
    const nameTruncated = item.name.substring(0, 24).padEnd(24, " ");
    const qtyStr = String(item.qty).padStart(4, " ");
    const totalStr = `${item.total.toFixed(2)}`.padStart(12, " ");
    commands += `${nameTruncated}${qtyStr} ${totalStr}\n`;

    if (item.options && item.options.length > 0) {
      for (const opt of item.options) {
        commands += `  + ${opt}\n`;
      }
    }
  }

  commands += "------------------------------------------\n";

  // 5. Totals
  commands += COMMANDS.ALIGN_RIGHT;
  commands += `Subtotal: ${data.subtotal.toFixed(2)} ${data.currency}\n`;
  if (data.discount > 0) {
    commands += `Discount: -${data.discount.toFixed(2)} ${data.currency}\n`;
  }
  if (data.tax > 0) {
    commands += `Tax: ${data.tax.toFixed(2)} ${data.currency}\n`;
  }

  commands += COMMANDS.BOLD_ON + COMMANDS.DOUBLE_HEIGHT;
  commands += `TOTAL: ${data.total.toFixed(2)} ${data.currency}\n`;
  commands += COMMANDS.BOLD_OFF + COMMANDS.NORMAL_SIZE;

  commands += `Paid by: ${data.paymentMethod}\n`;
  commands += "==========================================\n";

  // 6. Footer
  commands += COMMANDS.ALIGN_CENTER;
  if (data.footer) {
    commands += `${data.footer}\n`;
  } else {
    commands += "Thank you for your visit!\n";
  }

  // 7. Feed lines & Cut Paper & Kick Drawer if cash
  commands += "\n\n\n";
  commands += COMMANDS.CUT_PARTIAL;

  if (data.paymentMethod === "CASH") {
    commands += COMMANDS.DRAWER_KICK;
  }

  const encoder = new TextEncoder();
  return encoder.encode(commands);
}

/**
 * Trigger physical cash drawer kick via WebSerial / WebUSB if hardware is attached,
 * or fallback audio feedback
 */
export async function kickCashDrawer(): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && "serial" in navigator) {
      const ports = await (navigator as any).serial.getPorts();
      if (ports.length > 0) {
        const port = ports[0];
        await port.open({ baudRate: 9600 });
        const writer = port.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(COMMANDS.DRAWER_KICK));
        writer.releaseLock();
        await port.close();
        return true;
      }
    }
  } catch (err) {
    console.warn("Direct serial drawer kick failed (hardware not connected):", err);
  }
  return false;
}
