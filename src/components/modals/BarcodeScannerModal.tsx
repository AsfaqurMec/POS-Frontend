"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ScanBarcode,
  Camera,
  CameraOff,
  SwitchCamera,
  Zap,
  ZapOff,
  X,
  Search,
  Package,
  Receipt,
  Check,
  ShoppingCart,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
  Coffee,
  CheckCircle2,
} from "lucide-react";
import { useScannerStore, ScannerMode } from "@/store/scannerStore";
import { useLangStore } from "@/store/langStore";
import { usePosStore } from "@/store/posStore";
import { useCartStore } from "@/store/cartStore";
import { useBusiness } from "@/hooks/useQueries";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/env";
import { Item, ProductVariant, SaleResponse } from "@/types";
import { useRouter } from "next/navigation";

// Play audio beep & trigger haptic feedback on successful scan
function playScanSound() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    }
  } catch {
    // Ignore audio error if user hasn't interacted yet
  }

  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(100);
    } catch {
      // Ignore vibration error
    }
  }
}

interface InvoiceResultData {
  invoice: any;
  business?: any;
}

export function BarcodeScannerModal() {
  const { isOpen, mode, closeScanner, setMode } = useScannerStore();
  const { t, lang, dir } = useLangStore();
  const { openReceiptModal, openVariationModal } = usePosStore();
  const { addToCart } = useCartStore();
  const { data: business } = useBusiness();
  const router = useRouter();

  // Active view tab: "camera" or "manual"
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraIndex, setSelectedCameraIndex] = useState<number>(0);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Manual input state
  const [manualCode, setManualCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string>("");

  // Result states
  const [productResult, setProductResult] = useState<{
    item: Item;
    matchedVariant?: ProductVariant | null;
  } | null>(null);
  const [invoiceResult, setInvoiceResult] = useState<InvoiceResultData | null>(null);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Html5Qrcode instance reference
  const html5QrCodeRef = useRef<any>(null);
  const scannerContainerId = "reader-viewport";
  const lastProcessedTimeRef = useRef<number>(0);
  const manualInputRef = useRef<HTMLInputElement>(null);

  const currency = business?.currency || "SAR";

  // Perform search / lookup on scanned code
  const handleProcessBarcode = useCallback(
    async (codeToProcess: string, targetMode = mode) => {
      const code = codeToProcess.trim();
      if (!code) return;

      // Throttle rapid repeated scans of same code within 1.5 seconds
      const now = Date.now();
      if (code === lastScannedCode && now - lastProcessedTimeRef.current < 1500) {
        return;
      }
      lastProcessedTimeRef.current = now;
      setLastScannedCode(code);

      setIsSearching(true);
      setSearchError(null);
      setProductResult(null);
      setInvoiceResult(null);
      setAddedSuccess(false);

      playScanSound();

      try {
        if (targetMode === "PRODUCT") {
          const items = await api.get<Item[]>(`/items?search=${encodeURIComponent(code)}`);
          if (items && items.length > 0) {
            const lowerCode = code.toLowerCase();
            // Prioritize exact barcode or SKU match
            let matchedItem = items.find(
              (i) =>
                (i.barcode && i.barcode.toLowerCase() === lowerCode) ||
                (i.sku && i.sku.toLowerCase() === lowerCode)
            );
            let matchedVariant: ProductVariant | null = null;

            // Check variant barcodes if item not matched directly
            if (!matchedItem) {
              for (const itm of items) {
                const variant = itm.variants?.find(
                  (v) =>
                    (v.barcode && v.barcode.toLowerCase() === lowerCode) ||
                    (v.sku && v.sku.toLowerCase() === lowerCode)
                );
                if (variant) {
                  matchedItem = itm;
                  matchedVariant = variant;
                  break;
                }
              }
            }

            // Fallback to first item returned
            if (!matchedItem) {
              matchedItem = items[0];
            }

            setProductResult({ item: matchedItem, matchedVariant });
          } else {
            setSearchError(t.scanner.noProductFound || "No product found matching this barcode.");
          }
        } else {
          // INVOICE MODE
          const res = await api.get<{ invoice: any; business?: any }>(
            `/invoices/${encodeURIComponent(code)}`
          );
          if (res && res.invoice) {
            setInvoiceResult(res);
          } else {
            setSearchError(
              t.scanner.noInvoiceFound || "No invoice found matching this barcode / invoice number."
            );
          }
        }
      } catch (err: any) {
        if (targetMode === "INVOICE") {
          setSearchError(
            t.scanner.noInvoiceFound || "No invoice found matching this barcode / invoice number."
          );
        } else {
          setSearchError(
            t.scanner.noProductFound || "No product found matching this barcode."
          );
        }
      } finally {
        setIsSearching(false);
      }
    },
    [mode, lastScannedCode, t.scanner]
  );

  // Hardware Scanner Listener (USB / Bluetooth barcode scanner gun)
  useBarcodeScanner({
    onScan: (scannedBarcode) => {
      if (isOpen) {
        setManualCode(scannedBarcode);
        handleProcessBarcode(scannedBarcode);
      }
    },
  });

  // Stop camera function
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch {
        // Silently ignore stop errors
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  // Start camera function
  const startCamera = useCallback(
    async (cameraIndex = selectedCameraIndex) => {
      setCameraError(null);
      await stopCamera();

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

        // Discover camera devices if not yet populated
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
          }
        } catch {
          // Camera permission might need to be requested first
        }

        const qrCodeInstance = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        html5QrCodeRef.current = qrCodeInstance;

        // Choose camera: by deviceId if available, else environment facingMode
        let cameraConfig: any = { facingMode: { ideal: "environment" } };
        if (cameras.length > 0 && cameras[cameraIndex]?.id) {
          cameraConfig = { deviceId: { exact: cameras[cameraIndex].id } };
        }

        await qrCodeInstance.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            handleProcessBarcode(decodedText);
          },
          () => {
            // Frame scanned without code
          }
        );

        setIsCameraActive(true);

        // Check if torch/flashlight is supported
        try {
          const capabilities = qrCodeInstance.getRunningTrackCapabilities();
          if (capabilities && (capabilities as any).torch) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err: any) {
        setCameraError(
          t.scanner.cameraPermissionDenied ||
            "Camera access failed or was denied. You can still enter or scan codes manually."
        );
        setIsCameraActive(false);
      }
    },
    [selectedCameraIndex, cameras, handleProcessBarcode, stopCamera, t.scanner]
  );

  // Switch between available cameras
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (selectedCameraIndex + 1) % cameras.length;
    setSelectedCameraIndex(nextIndex);
    await startCamera(nextIndex);
  };

  // Toggle mobile flashlight / torch
  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextTorch = !isTorchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch {
      // Torch failed or unsupported
    }
  };

  // Start or stop camera based on modal open state and active tab
  useEffect(() => {
    if (isOpen && activeTab === "camera" && !productResult && !invoiceResult) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, productResult, invoiceResult, startCamera, stopCamera]);

  // Focus manual input when manual tab is clicked
  useEffect(() => {
    if (isOpen && activeTab === "manual" && manualInputRef.current) {
      setTimeout(() => manualInputRef.current?.focus(), 150);
    }
  }, [isOpen, activeTab]);

  // Handle manual form submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleProcessBarcode(manualCode);
    }
  };

  // Reset results and resume scanning
  const handleScanAnother = () => {
    setProductResult(null);
    setInvoiceResult(null);
    setSearchError(null);
    setManualCode("");
    setAddedSuccess(false);
    if (activeTab === "camera") {
      startCamera();
    }
  };

  // Action: Add product to cart
  const handleAddToCart = () => {
    if (!productResult) return;
    const { item, matchedVariant } = productResult;

    if (item.variationMode === "NONE" || matchedVariant) {
      addToCart(item, matchedVariant || null, [], 1);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2500);
    } else {
      // Item has options/variations to select
      openVariationModal(item);
      closeScanner();
    }
  };

  // Action: View & Print Receipt
  const handleViewReceipt = () => {
    if (!invoiceResult) return;
    const { invoice, business: invBusiness } = invoiceResult;
    const saleResponse: SaleResponse = {
      sale: {
        ...(invoice.sale || {}),
        invoice: invoice,
      },
      invoice: invoice,
      business: invBusiness || business,
    };

    closeScanner();
    openReceiptModal(saleResponse);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#18110B] border border-[#3C271B] rounded-2xl shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden"
        dir={dir}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#281B12] flex items-center justify-between shrink-0 bg-[#20140D]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {t.scanner.title}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {mode === "PRODUCT" ? t.scanner.modeProduct : t.scanner.modeInvoice}
                </span>
              </h2>
              <p className="text-[11px] text-[#A69485]">
                {mode === "PRODUCT" ? t.scanner.productModeDesc : t.scanner.invoiceModeDesc}
              </p>
            </div>
          </div>

          <button
            onClick={closeScanner}
            className="p-1.5 rounded-xl bg-[#281A12] text-warmgray-400 hover:text-white hover:bg-[#382418] transition"
            aria-label="Close scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (Product vs Invoice) */}
        <div className="p-3 bg-[#1D120B] border-b border-[#281B12] shrink-0">
          <div className="grid grid-cols-2 gap-2 bg-[#26170E] p-1 rounded-xl border border-[#3A2417]">
            <button
              type="button"
              onClick={() => {
                setMode("PRODUCT");
                setProductResult(null);
                setInvoiceResult(null);
                setSearchError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                mode === "PRODUCT"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
                  : "text-warmgray-400 hover:text-white hover:bg-[#321E12]"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t.scanner.modeProduct}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("INVOICE");
                setProductResult(null);
                setInvoiceResult(null);
                setSearchError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                mode === "INVOICE"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
                  : "text-warmgray-400 hover:text-white hover:bg-[#321E12]"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>{t.scanner.modeInvoice}</span>
            </button>
          </div>
        </div>

        {/* Scanner View Controls (Camera / Manual Input) */}
        {!productResult && !invoiceResult && (
          <div className="flex border-b border-[#281B12] text-xs font-semibold px-4 pt-2 shrink-0 bg-[#1A1009]">
            <button
              type="button"
              onClick={() => setActiveTab("camera")}
              className={`pb-2 pe-4 ps-1 border-b-2 flex items-center gap-1.5 transition ${
                activeTab === "camera"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-warmgray-400 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t.scanner.cameraScanner}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`pb-2 pe-4 ps-1 border-b-2 flex items-center gap-1.5 transition ${
                activeTab === "manual"
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-warmgray-400 hover:text-white"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t.scanner.manualEntry}</span>
            </button>
          </div>
        )}

        {/* Modal Body / Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. PRODUCT RESULT VIEW */}
          {productResult && (
            <div className="bg-[#24160E] border border-emerald-500/30 rounded-2xl p-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#382316] pb-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.scanner.productFound}</span>
                </div>
                <button
                  onClick={handleScanAnother}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t.scanner.scanAnother}</span>
                </button>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#2D1B12] border border-[#43291B] overflow-hidden shrink-0 flex items-center justify-center">
                  {productResult.item.imageUrl ? (
                    <img
                      src={getMediaUrl(productResult.item.imageUrl)}
                      alt={productResult.item.nameEn}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Coffee className="w-8 h-8 text-amber-500/60" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    {productResult.item.category?.nameEn || "Category"}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-white truncate">
                    {lang === "ar" ? productResult.item.nameAr : productResult.item.nameEn}
                  </h3>
                  <p className="text-xs text-[#A69485] truncate">
                    {lang === "ar" ? productResult.item.nameEn : productResult.item.nameAr}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-base font-extrabold text-amber-300 font-mono">
                      {(productResult.matchedVariant?.price ?? productResult.item.basePrice).toFixed(
                        2
                      )}{" "}
                      {currency}
                    </span>

                    {productResult.item.stockEnabled && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          productResult.item.stockQuantity > 0
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-950/60 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {productResult.item.stockQuantity > 0
                          ? `${t.scanner.stock}: ${productResult.item.stockQuantity}`
                          : t.scanner.outOfStock}
                      </span>
                    )}

                    {productResult.matchedVariant && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30">
                        {productResult.matchedVariant.sku || "Variant"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Barcode & SKU info tags */}
              <div className="bg-[#1A0F0A] p-2.5 rounded-xl border border-[#341F14] flex flex-wrap items-center justify-between text-xs font-mono text-warmgray-400 gap-2">
                <span>SKU: {productResult.matchedVariant?.sku || productResult.item.sku || "—"}</span>
                <span>
                  Barcode:{" "}
                  {productResult.matchedVariant?.barcode || productResult.item.barcode || lastScannedCode}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 ${
                    addedSuccess
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/30"
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t.scanner.addedToCart}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t.scanner.addToCart}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeScanner();
                    router.push(`/products/${productResult.item.id}`);
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold border border-[#3C271B] text-warmgray-300 hover:text-white hover:bg-[#281A12] flex items-center justify-center gap-1.5 transition"
                >
                  <span>{t.scanner.viewProduct}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 2. INVOICE RESULT VIEW */}
          {invoiceResult && (
            <div className="bg-[#24160E] border border-emerald-500/30 rounded-2xl p-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#382316] pb-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.scanner.invoiceFound}</span>
                </div>
                <button
                  onClick={handleScanAnother}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t.scanner.scanAnother}</span>
                </button>
              </div>

              {/* Invoice details grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#A69485] uppercase tracking-wider block">
                      Invoice Number
                    </span>
                    <span className="text-base font-extrabold text-amber-400 font-mono">
                      {invoiceResult.invoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-[10px] text-[#A69485] uppercase tracking-wider block">
                      {t.scanner.total}
                    </span>
                    <span className="text-lg font-extrabold text-white font-mono">
                      {(invoiceResult.invoice.totalAmount || 0).toFixed(2)} {currency}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#1A0F0A] p-3 rounded-xl border border-[#341F14]">
                  <div>
                    <span className="text-[10px] text-[#A69485] block">{t.scanner.date}</span>
                    <span className="font-medium text-white">
                      {new Date(invoiceResult.invoice.createdAt).toLocaleDateString(
                        lang === "ar" ? "ar-SA" : "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#A69485] block">{t.scanner.paymentMethod}</span>
                    <span className="font-medium text-white">
                      {invoiceResult.invoice.sale?.paymentMethod || "CASH"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#A69485] block">{t.scanner.cashier}</span>
                    <span className="font-medium text-white">
                      {invoiceResult.invoice.sale?.user?.name || "Cashier"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#A69485] block">{t.scanner.itemsCount}</span>
                    <span className="font-medium text-white">
                      {invoiceResult.invoice.sale?.items?.length || 1} items
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleViewReceipt}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition active:scale-95"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{t.scanner.viewReceipt}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeScanner();
                    router.push(
                      `/orders/${invoiceResult.invoice.saleId || invoiceResult.invoice.sale?.id}`
                    );
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold border border-[#3C271B] text-warmgray-300 hover:text-white hover:bg-[#281A12] flex items-center justify-center gap-1.5 transition"
                >
                  <span>{t.scanner.viewOrder}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 3. ERROR MESSAGE */}
          {searchError && (
            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{searchError}</p>
                {lastScannedCode && (
                  <p className="text-[11px] text-red-400/80 font-mono mt-0.5">
                    Scanned Code: {lastScannedCode}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSearchError(null)}
                className="text-red-400 hover:text-white text-xs font-semibold"
              >
                {t.scanner.close}
              </button>
            </div>
          )}

          {/* 4. CAMERA VIEWPORT */}
          {!productResult && !invoiceResult && activeTab === "camera" && (
            <div className="space-y-3">
              <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-[4/3] border border-[#3C271B] shadow-inner flex items-center justify-center">
                {/* HTML5 QR Code Mount Node */}
                <div id={scannerContainerId} className="w-full h-full object-cover" />

                {/* Animated Aiming Reticle Overlay */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-40 border-2 border-amber-400/80 rounded-xl relative shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                      {/* Corner Accents */}
                      <span className="absolute -top-1 -start-1 w-4 h-4 border-t-2 border-s-2 border-amber-400" />
                      <span className="absolute -top-1 -end-1 w-4 h-4 border-t-2 border-e-2 border-amber-400" />
                      <span className="absolute -bottom-1 -start-1 w-4 h-4 border-b-2 border-s-2 border-amber-400" />
                      <span className="absolute -bottom-1 -end-1 w-4 h-4 border-b-2 border-e-2 border-amber-400" />

                      {/* Animated Red Laser Scan Line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-[bounce_2s_infinite]" />
                    </div>
                  </div>
                )}

                {/* Camera Floating Controls (Torch, Camera Switch) */}
                {isCameraActive && (
                  <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3 pointer-events-auto">
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={handleToggleTorch}
                        className={`p-2 rounded-full border backdrop-blur-md transition ${
                          isTorchOn
                            ? "bg-amber-500 text-black border-amber-400"
                            : "bg-black/60 text-white border-white/20 hover:bg-black/80"
                        }`}
                        title={t.scanner.toggleTorch}
                      >
                        {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                      </button>
                    )}

                    {cameras.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="p-2 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md hover:bg-black/80 transition"
                        title={t.scanner.switchCamera}
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={stopCamera}
                      className="p-2 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md hover:bg-black/80 transition"
                      title={t.scanner.stopCamera}
                    >
                      <CameraOff className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Loading / Searching Spinner Overlay */}
                {isSearching && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                    <span className="text-xs font-semibold text-white">Searching barcode...</span>
                  </div>
                )}

                {/* Camera Permission / Error / Inactive State */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#1C120B]">
                    <div className="w-12 h-12 rounded-full bg-[#2A180E] border border-[#3E2315] flex items-center justify-center text-amber-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    {cameraError ? (
                      <p className="text-xs text-red-300 max-w-xs">{cameraError}</p>
                    ) : (
                      <p className="text-xs text-warmgray-400 max-w-xs">{t.scanner.pointingTip}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition"
                    >
                      {t.scanner.startCamera}
                    </button>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-center text-[#8C7A6B]">
                {t.scanner.pointingTip}
              </p>
            </div>
          )}

          {/* 5. MANUAL / HARDWARE SCANNER INPUT TAB */}
          {!productResult && !invoiceResult && (
            <div className="space-y-3">
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label className="text-xs font-semibold text-warmgray-300 block">
                  {mode === "PRODUCT"
                    ? t.scanner.manualPlaceholderProduct
                    : t.scanner.manualPlaceholderInvoice}
                </label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <ScanBarcode className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
                    <input
                      ref={manualInputRef}
                      type="text"
                      data-barcode-catcher="true"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder={
                        mode === "PRODUCT"
                          ? "e.g. 6281001001, LATTE-01..."
                          : "e.g. INV-000101, ORD-001..."
                      }
                      className="w-full ps-10 pe-8 py-2.5 bg-[#251810] border border-[#3C271B] rounded-xl text-xs text-white placeholder-[#8C7A6B] focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-mono transition"
                    />
                    {manualCode && (
                      <button
                        type="button"
                        onClick={() => setManualCode("")}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-warmgray-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSearching || !manualCode.trim()}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white flex items-center gap-1.5 shadow-md transition shrink-0"
                  >
                    {isSearching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>{t.scanner.search}</span>
                  </button>
                </div>
              </form>

              <div className="bg-[#1F130B] border border-[#331E12] rounded-xl p-3 flex items-center gap-2.5 text-[11px] text-warmgray-400">
                <ScanBarcode className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  External USB/Bluetooth barcode guns will automatically capture and search while this window is open.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#1A1009] border-t border-[#281B12] flex items-center justify-between text-xs text-[#A69485] shrink-0">
          <span className="font-mono text-[11px]">
            Mode: <strong className="text-white">{mode}</strong>
          </span>
          <button
            onClick={closeScanner}
            className="px-4 py-1.5 rounded-lg border border-[#3C271B] text-warmgray-300 hover:text-white hover:bg-[#281A12] font-semibold transition"
          >
            {t.scanner.close}
          </button>
        </div>
      </div>
    </div>
  );
}
