"use client";

import React, { useRef, useState, useEffect } from "react";
import { usePosStore } from "@/store/posStore";
import { useLangStore } from "@/store/langStore";
import { useBusiness } from "@/hooks/useQueries";
import { getMediaUrl } from "@/lib/env";
import { Printer, CheckCircle, X, Coffee, Zap, Usb } from "lucide-react";
import { printDirectWebSerial, ReceiptPrintData } from "@/lib/escpos";


import JsBarcode from "jsbarcode";

// 100% compliant ISO/IEC 15417 Code 128 vector barcode
function ReceiptBarcode({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value.trim(), {
          format: "CODE128",
          lineColor: "#000000",
          width: 1.6,
          height: 42,
          displayValue: true,
          font: "monospace",
          fontSize: 11,
          textMargin: 4,
          margin: 4,
          background: "transparent",
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center py-1">
      <svg ref={svgRef} className="max-w-full h-auto block mx-auto" />
    </div>
  );
}

export function ReceiptModal() {
  const { isReceiptModalOpen, lastCompletedSale, closeReceiptModal } = usePosStore();
  const { lang, t } = useLangStore();
  const { data: globalBusiness } = useBusiness();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Auto-Print state from localStorage (default: true)
  const [autoPrint, setAutoPrint] = useState<boolean>(true);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [usbPrintStatus, setUsbPrintStatus] = useState<string | null>(null);
  const hasAutoPrintedRef = useRef<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pos_auto_print");
    if (saved !== null) {
      setAutoPrint(saved === "true");
    }
  }, []);

  const toggleAutoPrint = () => {
    const newVal = !autoPrint;
    setAutoPrint(newVal);
    localStorage.setItem("pos_auto_print", String(newVal));
  };

  const handlePrint = () => {
    setIsPrinting(true);
    try {
      window.print();
    } catch (e) {
      console.error("Print error:", e);
    } finally {
      setTimeout(() => setIsPrinting(false), 1200);
    }
  };

  // Automatically trigger print when modal opens if autoPrint is enabled
  useEffect(() => {
    if (isReceiptModalOpen && lastCompletedSale?.sale?.id) {
      const saleId = lastCompletedSale.sale.id;
      if (autoPrint && hasAutoPrintedRef.current !== saleId) {
        hasAutoPrintedRef.current = saleId;
        const timer = setTimeout(() => {
          handlePrint();
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [isReceiptModalOpen, lastCompletedSale, autoPrint]);

  // Direct USB / Serial ESC-POS Printing (Zero Dialogs)
  const handleDirectUsbPrint = async () => {
    if (!lastCompletedSale) return;
    setUsbPrintStatus("connecting...");
    try {
      const { sale, invoice, business: saleBiz } = lastCompletedSale;
      const bName =
        lang === "ar"
          ? saleBiz?.nameAr || saleBiz?.nameEn || globalBusiness?.nameAr || globalBusiness?.nameEn || ""
          : saleBiz?.nameEn || saleBiz?.nameAr || globalBusiness?.nameEn || globalBusiness?.nameAr || "";
      const bAddr =
        lang === "ar"
          ? saleBiz?.addressAr || saleBiz?.addressEn || globalBusiness?.addressAr || globalBusiness?.addressEn
          : saleBiz?.addressEn || saleBiz?.addressAr || globalBusiness?.addressEn || globalBusiness?.addressAr;

      const printData: ReceiptPrintData = {
        businessName: bName || "Specialty Coffee",
        phone: saleBiz?.phone || globalBusiness?.phone || undefined,
        address: bAddr || undefined,
        orderNumber: sale.orderNumber || invoice.invoiceNumber.replace("INV-", "ORD-"),
        invoiceNumber: invoice.invoiceNumber,
        cashierName: sale.user?.name || invoice.cashierName || "Staff",
        date: invoice.issueDate,
        time: invoice.issueTime,
        orderType: sale.orderType || "DINE_IN",
        items: (sale.items || []).map((it) => ({
          name: lang === "ar" ? it.itemNameArSnapshot : it.itemNameEnSnapshot,
          qty: it.quantity,
          price: it.unitPrice,
          total: (it as any).totalPrice ?? it.lineTotal ?? (it.quantity * it.unitPrice),
          options: (it.options || []).map((o: any) =>
            typeof o === "string" ? o : `${o.name || ""}: ${o.value || ""}`
          ),
        })),
        subtotal: invoice.subtotal,
        discount: invoice.discount || 0,
        tax: invoice.tax || 0,
        total: invoice.totalAmount,
        paymentMethod: invoice.paymentMethod,
        currency: t.common.sar || saleBiz?.currency || "SAR",
        footer: (lang === "ar" ? saleBiz?.receiptFooterAr : saleBiz?.receiptFooterEn) || t.receipt.thankYou,
      };

      const res = await printDirectWebSerial(printData, true);
      if (res.success) {
        setUsbPrintStatus("Printed!");
        setTimeout(() => setUsbPrintStatus(null), 3000);
      } else {
        setUsbPrintStatus("Error: " + (res.error || "Failed"));
        setTimeout(() => setUsbPrintStatus(null), 4000);
      }
    } catch (err: any) {
      setUsbPrintStatus("Failed");
      setTimeout(() => setUsbPrintStatus(null), 4000);
    }
  };

  if (!isReceiptModalOpen || !lastCompletedSale) return null;

  const { sale, invoice, business } = lastCompletedSale;

  const businessName =
    lang === "ar"
      ? business?.nameAr || business?.nameEn || globalBusiness?.nameAr || globalBusiness?.nameEn || ""
      : business?.nameEn || business?.nameAr || globalBusiness?.nameEn || globalBusiness?.nameAr || "";
  const businessAddress =
    lang === "ar"
      ? business?.addressAr || business?.addressEn || globalBusiness?.addressAr || globalBusiness?.addressEn
      : business?.addressEn || business?.addressAr || globalBusiness?.addressEn || globalBusiness?.addressAr;
  const footerMessage =
    lang === "ar"
      ? business?.receiptFooterAr || globalBusiness?.receiptFooterAr
      : business?.receiptFooterEn || globalBusiness?.receiptFooterEn;
  const rawLogo = business?.logoUrl || globalBusiness?.logoUrl;
  const logoUrl = getMediaUrl(rawLogo);

  // Determine VAT / Tax percentage to display
  const taxRate = (() => {
    if (business?.taxRate !== undefined && business.taxRate !== null && business.taxRate > 0) {
      return business.taxRate;
    }
    if (globalBusiness?.taxRate !== undefined && globalBusiness.taxRate !== null && globalBusiness.taxRate > 0) {
      return globalBusiness.taxRate;
    }
    if (invoice.tax > 0 && invoice.subtotal > 0) {
      const net = invoice.subtotal - (invoice.discount || 0);
      if (net > 0) {
        const excRate = Math.round((invoice.tax / net) * 100);
        const incRate = Math.round((invoice.tax / (net - invoice.tax)) * 100);
        if (excRate > 0 && excRate <= 100) return excRate;
        if (incRate > 0 && incRate <= 100) return incRate;
      }
    }
    return 15; // Standard VAT default in KSA/GCC
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-warmgray-900 rounded-3xl max-w-sm w-full max-h-[92vh] flex flex-col shadow-2xl border border-warmgray-200 dark:border-warmgray-800 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-3 border-b border-warmgray-200 dark:border-warmgray-800 flex items-center justify-between shrink-0 bg-emerald-50 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold text-xs block">{t.pos.saleSuccess}</span>
              <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300">
                {sale.orderNumber || invoice.invoiceNumber.replace("INV-", "ORD-")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleAutoPrint}
              title={autoPrint ? "Auto-print is enabled" : "Auto-print is disabled"}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition shadow-sm ${
                autoPrint
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300"
                  : "bg-white text-gray-500 dark:bg-warmgray-800 dark:text-warmgray-400 border border-warmgray-200"
              }`}
            >
              <Zap className={`w-3 h-3 ${autoPrint ? "text-amber-600 fill-amber-500" : "text-gray-400"}`} />
              <span>{autoPrint ? "Auto: ON" : "Auto: OFF"}</span>
            </button>
            <button
              onClick={closeReceiptModal}
              className="p-1.5 text-warmgray-500 hover:text-warmgray-800 dark:text-warmgray-400 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="flex-1 overflow-y-auto p-5 bg-warmgray-50 dark:bg-warmgray-950">
          <div
            ref={receiptRef}
            id="printable-receipt"
            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
            className="bg-white text-black p-6 rounded-2xl shadow-sm border border-warmgray-200 font-mono text-xs space-y-4 print:p-0 print:shadow-none print:border-none"
          >
            {/* Business Header */}
            <div className="text-center space-y-1 border-b border-dashed border-gray-300 pb-3">
              <div className="flex justify-center mb-1">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={businessName}
                    className="w-14 h-14 object-contain mx-auto"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center">
                    <Coffee className="w-4 h-4" />
                  </div>
                )}
              </div>
              <h1 className="text-base font-bold leading-tight uppercase tracking-wider">
                {businessName || "Specialty Coffee"}
              </h1>
              {businessAddress && <p className="text-[10px] text-gray-600">{businessAddress}</p>}
              {business?.phone && <p className="text-[10px] text-gray-600">Tel: {business.phone}</p>}
              <p className="text-[10px] font-bold tracking-widest pt-1">
                *** {t.receipt.invoiceTitle} ***
              </p>
            </div>

            {/* Prominent Cafe Order / Ticket Number */}
            <div className="text-center py-2 px-3 border-y-2 border-black bg-gray-50 my-1">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-600">
                {lang === "ar" ? "رقم الطلب / تذكرة الاستلام" : "ORDER TICKET #"}
              </span>
              <span className="text-2xl font-black tracking-wider block font-mono">
                {sale.orderNumber || invoice.invoiceNumber.replace("INV-", "ORD-")}
              </span>
            </div>

            {/* Invoice Meta */}
            <div className="space-y-0.5 text-[11px] border-b border-dashed border-gray-300 pb-2">
              <div className="flex justify-between">
                <span>{lang === "ar" ? "رقم الطلب (Order ID):" : "Order ID:"}</span>
                <span className="font-bold">{sale.orderNumber || invoice.invoiceNumber.replace("INV-", "ORD-")}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.receipt.invoiceNumber}:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.receipt.date}:</span>
                <span>
                  {invoice.issueDate} {invoice.issueTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t.receipt.cashier}:</span>
                <span className="font-bold">{sale.user?.name || invoice.cashierName || "Staff"}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.receipt.orderType}:</span>
                <span className="font-bold uppercase">
                  {sale.orderType === "TAKEAWAY"
                    ? lang === "ar"
                      ? "سفري (Takeaway)"
                      : "Takeaway"
                    : lang === "ar"
                    ? "محلي (Dine In)"
                    : "Dine In"}
                </span>
              </div>
              {(sale.customerName || invoice.customerName) && (
                <div className="flex justify-between">
                  <span>{t.receipt.customer}:</span>
                  <span className="font-bold">{sale.customerName || invoice.customerName}</span>
                </div>
              )}
              {(sale.customerPhone || invoice.customerPhone) && (
                <div className="flex justify-between">
                  <span>{t.receipt.customerPhone}:</span>
                  <span>{sale.customerPhone || invoice.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t.receipt.paymentMethod}:</span>
                <span className="font-bold">{invoice.paymentMethod}</span>
              </div>
            </div>

            {/* 3-Column Items Table: ITEM | QUANTITY | AMOUNT */}
            <div className="border-b border-dashed border-gray-300 pb-3">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-y border-dashed border-gray-400 font-bold uppercase tracking-wider text-[10px] text-gray-800">
                    <th className="py-1.5 text-start font-bold">{t.receipt.item}</th>
                    <th className="py-1.5 text-center font-bold w-12 px-1">{t.receipt.qty}</th>
                    <th className="py-1.5 text-end font-bold w-20">{t.receipt.amount}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-gray-200">
                  {sale.items?.map((item, idx) => {
                    const name = lang === "ar" ? item.itemNameArSnapshot : item.itemNameEnSnapshot;
                    const hasOptions = item.options && item.options.length > 0;
                    const currency = t.common.sar || business?.currency || "SAR";
                    const basePrice = item.baseUnitPrice || item.unitPrice || 0;

                    return (
                      <tr key={idx} className="align-top">
                        {/* 1. Item Column */}
                        <td className="py-2 pe-1 text-start">
                          <div className="font-bold text-gray-900 leading-snug">{name}</div>

                          {/* Base Price Display */}
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            <span className="text-gray-500">{t.receipt.basePrice || "Base Price"}:</span>{" "}
                            <span className="font-medium text-gray-700">{basePrice.toFixed(2)} {currency}</span>
                            {item.quantity > 1 && (
                              <span className="text-gray-400 ms-1">({t.receipt.each || "ea"})</span>
                            )}
                          </div>

                          {/* Add-ons & Modifiers */}
                          {hasOptions && (
                            <div className="mt-1 ps-1.5 space-y-0.5 border-s-2 border-amber-600/40 text-[10px] text-gray-600">
                              {item.options.map((opt, oIdx) => {
                                const optName = lang === "ar" ? opt.optionNameAr : opt.optionNameEn;
                                return (
                                  <div key={oIdx} className="flex justify-between pe-1 text-gray-700">
                                    <span>+ {optName}</span>
                                    {opt.priceAdjustment > 0 && (
                                      <span className="font-mono text-gray-500">
                                        +{opt.priceAdjustment.toFixed(2)} {currency}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* 2. Quantity Column */}
                        <td className="py-2 px-1 text-center font-bold text-gray-800 font-mono">
                          {item.quantity}
                        </td>

                        {/* 3. Amount Column */}
                        <td className="py-2 ps-1 text-end font-bold text-gray-900 font-mono whitespace-nowrap">
                          {item.lineTotal.toFixed(2)} {currency}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1 text-[11px]">
              {(() => {
                const currency = t.common.sar || business?.currency || "SAR";
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t.receipt.subtotal}:</span>
                      <span className="font-mono font-medium">{invoice.subtotal.toFixed(2)} {currency}</span>
                    </div>
                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>{t.receipt.discount}:</span>
                        <span className="font-mono font-medium">-{invoice.discount.toFixed(2)} {currency}</span>
                      </div>
                    )}
                    {/* VAT / Tax with Percentage */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {lang === "ar"
                          ? `ضريبة القيمة المضافة (${taxRate}%)`
                          : `VAT (${taxRate}%)`}:
                      </span>
                      <span className="font-mono font-medium">{invoice.tax.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-sm pt-1.5 pb-1 border-y-2 border-gray-900 my-1">
                      <span>{t.receipt.total}:</span>
                      <span className="font-mono">{invoice.totalAmount.toFixed(2)} {currency}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Barcode & Footer */}
            <div className="text-center pt-2 text-[10px] text-gray-500 border-t border-dashed border-gray-300 space-y-2">
              {/* Thermal Barcode SVG - 100% printable on all thermal printers & browsers */}
              <ReceiptBarcode value={invoice.invoiceNumber} />

              <p className="font-medium">{footerMessage || t.receipt.thankYou}</p>
              <p className="text-[9px] text-gray-400">Powered by {businessName || "POS"}</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3.5 border-t border-warmgray-200 dark:border-warmgray-800 bg-white dark:bg-warmgray-900 shrink-0 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeReceiptModal}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-warmgray-300 dark:border-warmgray-700 text-warmgray-700 dark:text-warmgray-200 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
            >
              {t.receipt.close}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/20 active:scale-95 transition disabled:opacity-75"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? (lang === "ar" ? "جارٍ الطباعة..." : "Printing...") : t.receipt.print}</span>
            </button>
          </div>

          {/* Quick Hardware Direct USB Print & Silent Info */}
          <div className="flex items-center justify-between text-[10px] text-warmgray-500 dark:text-warmgray-400 pt-0.5 px-0.5">
            <span className="truncate flex items-center gap-1 text-[10px]">
              <span>⚡ {lang === "ar" ? "طباعة تلقائية بدون نوافذ:" : "Silent print:"}</span>
              <span className="font-mono text-[9px] bg-warmgray-100 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 px-1 py-0.5 rounded">--kiosk-printing</span>
            </span>
            <button
              type="button"
              onClick={handleDirectUsbPrint}
              className="shrink-0 flex items-center gap-1 text-amber-600 hover:text-amber-700 dark:text-amber-400 font-bold ml-2 underline underline-offset-2"
              title="Direct hardware ESC/POS over USB"
            >
              <Usb className="w-3 h-3" />
              <span>{usbPrintStatus || (lang === "ar" ? "طباعة USB مباشرة" : "Direct USB")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}