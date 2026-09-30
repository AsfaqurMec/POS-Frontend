"use client";

import React, { useState, useEffect } from "react";
import { useBusiness, useUsers } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { useThemeStore } from "@/store/themeStore";
import { api } from "@/lib/api";
import {
  Building2,
  Receipt,
  Percent,
  Upload,
  Check,
  Save,
  Sun,
  Moon,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Lock,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getMediaUrl } from "@/lib/env";
import { useAuthStore } from "@/store/authStore";
import { UserWithStats } from "@/types";

export default function SettingsPage() {
  const { lang, t } = useLangStore();
  const { theme, setTheme } = useThemeStore();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isGuest = user?.role === "GUEST";
  const { data: business, isLoading } = useBusiness();

  // Business Profile Form
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [phone, setPhone] = useState("");
  const [addressEn, setAddressEn] = useState("");
  const [addressAr, setAddressAr] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [timezone, setTimezone] = useState("Asia/Riyadh");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Invoice & Receipt Settings
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [footerEn, setFooterEn] = useState("");
  const [footerAr, setFooterAr] = useState("");

  // Tax Settings
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState("0");
  const [pricingMode, setPricingMode] = useState<"INCLUSIVE" | "EXCLUSIVE">("INCLUSIVE");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Staff & Admin Security PINs Management
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const [pinVisibility, setPinVisibility] = useState<Record<string, boolean>>({});
  const [updatingPinUserId, setUpdatingPinUserId] = useState<string | null>(null);
  const [pinFeedback, setPinFeedback] = useState<Record<string, { type: "success" | "error"; message: string }>>({});

  const handlePinInputChange = (userId: string, val: string) => {
    if (isGuest) return;
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setPinInputs((prev) => ({ ...prev, [userId]: cleaned }));
  };

  const handleTogglePinVisibility = (userId: string) => {
    setPinVisibility((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleGenerateRandomPin = (userId: string) => {
    if (isGuest) return;
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPinInputs((prev) => ({ ...prev, [userId]: randomPin }));
    setPinVisibility((prev) => ({ ...prev, [userId]: true }));
  };

  const handleSavePin = async (userId: string) => {
    if (isGuest) return;
    const pin = pinInputs[userId];
    if (!pin || pin.length < 4) {
      setPinFeedback((prev) => ({
        ...prev,
        [userId]: {
          type: "error",
          message: lang === "ar" ? "يجب أن يتكون الرمز من 4 إلى 6 أرقام" : "PIN must be 4 to 6 digits",
        },
      }));
      setTimeout(() => {
        setPinFeedback((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, 3500);
      return;
    }

    setUpdatingPinUserId(userId);
    try {
      await api.patch(`/users/${userId}/pin`, { pinCode: pin });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setPinFeedback((prev) => ({
        ...prev,
        [userId]: {
          type: "success",
          message: lang === "ar" ? "تم تحديث الرمز بنجاح!" : "PIN updated successfully!",
        },
      }));
      setPinInputs((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setTimeout(() => {
        setPinFeedback((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, 3500);
    } catch (err: any) {
      setPinFeedback((prev) => ({
        ...prev,
        [userId]: {
          type: "error",
          message: err.message || (lang === "ar" ? "فشل تحديث الرمز" : "Failed to update PIN"),
        },
      }));
      setTimeout(() => {
        setPinFeedback((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, 3500);
    } finally {
      setUpdatingPinUserId(null);
    }
  };

  const handleRemovePin = async (userId: string) => {
    if (isGuest) return;
    if (
      !window.confirm(
        lang === "ar"
          ? "هل أنت متأكد من حذف رمز PIN لهذا المستخدم؟"
          : "Are you sure you want to remove this user's PIN?"
      )
    ) {
      return;
    }

    setUpdatingPinUserId(userId);
    try {
      await api.patch(`/users/${userId}/pin`, { pinCode: null });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setPinInputs((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      setPinFeedback((prev) => ({
        ...prev,
        [userId]: {
          type: "success",
          message: lang === "ar" ? "تمت إزالة الرمز" : "PIN removed successfully",
        },
      }));
      setTimeout(() => {
        setPinFeedback((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, 3500);
    } catch (err: any) {
      setPinFeedback((prev) => ({
        ...prev,
        [userId]: {
          type: "error",
          message: err.message || "Failed to remove PIN",
        },
      }));
    } finally {
      setUpdatingPinUserId(null);
    }
  };

  useEffect(() => {
    if (business) {
      setNameEn(business.nameEn || "");
      setNameAr(business.nameAr || "");
      setPhone(business.phone || "");
      setAddressEn(business.addressEn || "");
      setAddressAr(business.addressAr || "");
      setCurrency(business.currency || "SAR");
      setTimezone(business.timezone || "Asia/Riyadh");
      setInvoicePrefix(business.invoicePrefix || "INV-");
      setFooterEn(business.receiptFooterEn || "");
      setFooterAr(business.receiptFooterAr || "");
      setTaxEnabled(business.taxEnabled || false);
      setTaxRate((business.taxRate || 0).toString());
      setPricingMode(business.pricingMode || "INCLUSIVE");
      setLogoPreview(getMediaUrl(business.logoUrl));
    }
  }, [business]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const formData = new FormData();
      formData.append("nameEn", nameEn);
      formData.append("nameAr", nameAr);
      formData.append("phone", phone);
      formData.append("addressEn", addressEn);
      formData.append("addressAr", addressAr);
      formData.append("currency", currency);
      formData.append("timezone", timezone);
      formData.append("invoicePrefix", invoicePrefix);
      formData.append("receiptFooterEn", footerEn);
      formData.append("receiptFooterAr", footerAr);
      formData.append("taxEnabled", String(taxEnabled));
      formData.append("taxRate", taxRate);
      formData.append("pricingMode", pricingMode);

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      await api.patch("/business", formData, true);
      queryClient.invalidateQueries({ queryKey: ["business"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-6 min-h-full pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-warmgray-900 dark:text-white tracking-tight">
            {t.settings.title}
          </h1>
          <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-1">
            {lang === "ar"
              ? "إعداد هوية المنشأة، الإيصالات، والعملة"
              : "Configure your business identity, receipts, and currency"}
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Business Details */}
        <div className="bg-white dark:bg-warmgray-900 rounded-3xl p-6 border border-warmgray-200 dark:border-warmgray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm border-b border-warmgray-100 dark:border-warmgray-800 pb-3">
            <Building2 className="w-4 h-4" />
            <span>{t.settings.businessTitle}</span>
          </div>

          {/* Logo Upload */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-warmgray-100 dark:bg-warmgray-800 border-2 border-dashed border-warmgray-300 dark:border-warmgray-700 flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Upload className="w-5 h-5 text-warmgray-500 dark:text-warmgray-400" />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {lang === "ar" ? "شعار المنشأة (اللوجو)" : "Business Logo"}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    const f = e.target.files[0];
                    setLogoFile(f);
                    setLogoPreview(URL.createObjectURL(f));
                  }
                }}
                className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium file:me-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-amber-50 file:text-amber-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.settings.shopNameEn} *
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.settings.shopNameAr} *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-end"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.settings.phone}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+966 50 123 4567"
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.settings.currency}
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.settings.timezone}
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.settings.addressEn}
              </label>
              <input
                type="text"
                value={addressEn}
                onChange={(e) => setAddressEn(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.settings.addressAr}
              </label>
              <input
                type="text"
                value={addressAr}
                onChange={(e) => setAddressAr(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-end"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Invoice & Receipt Configuration */}
        <div className="bg-white dark:bg-warmgray-900 rounded-3xl p-6 border border-warmgray-200 dark:border-warmgray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm border-b border-warmgray-100 dark:border-warmgray-800 pb-3">
            <Receipt className="w-4 h-4" />
            <span>{t.settings.invoiceTitle}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
              {t.settings.invoicePrefix}
            </label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="INV-"
              className="w-48 px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.settings.footerEn}
              </label>
              <textarea
                rows={2}
                value={footerEn}
                onChange={(e) => setFooterEn(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                {t.settings.footerAr}
              </label>
              <textarea
                rows={2}
                value={footerAr}
                onChange={(e) => setFooterAr(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-end"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Generic Tax (Optional) */}
        <div className="bg-white dark:bg-warmgray-900 rounded-3xl p-6 border border-warmgray-200 dark:border-warmgray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm border-b border-warmgray-100 dark:border-warmgray-800 pb-3">
            <Percent className="w-4 h-4" />
            <span>{t.settings.taxTitle}</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={taxEnabled}
              onChange={(e) => setTaxEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs font-bold text-warmgray-900 dark:text-white">
              {t.settings.taxEnabled}
            </span>
          </label>

          {taxEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                  {t.settings.taxRate}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
                  {t.settings.pricingMode}
                </label>
                <select
                  value={pricingMode}
                  onChange={(e) => setPricingMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-semibold"
                >
                  <option value="INCLUSIVE">{t.settings.inclusive}</option>
                  <option value="EXCLUSIVE">{t.settings.exclusive}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Appearance & Theme */}
        <div className="bg-white dark:bg-warmgray-900 rounded-3xl p-6 border border-warmgray-200 dark:border-warmgray-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm border-b border-warmgray-100 dark:border-warmgray-800 pb-3">
            <Sun className="w-4 h-4" />
            <span>Appearance & Theme</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-4 rounded-2xl border text-start flex items-center gap-3 transition ${
                theme === "light"
                  ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-600"
                  : "border-warmgray-200 dark:border-warmgray-800 hover:border-warmgray-300 dark:hover:border-warmgray-700"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-warmgray-900 dark:text-white">Light Mode</p>
                <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">Clean, crisp light interface</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-2xl border text-start flex items-center gap-3 transition ${
                theme === "dark"
                  ? "border-amber-600 bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-600"
                  : "border-warmgray-200 dark:border-warmgray-800 hover:border-warmgray-300 dark:hover:border-warmgray-700"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-warmgray-800 text-amber-300 flex items-center justify-center shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-warmgray-900 dark:text-white">Dark Mode</p>
                <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">Rich, dark coffee ambiance</p>
              </div>
            </button>
          </div>
        </div>

        {/* Section 5: Staff & Admin Security PINs (Terminal Lock & Access) */}
        <div className="bg-white dark:bg-warmgray-900 rounded-3xl p-6 border border-warmgray-200 dark:border-warmgray-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-warmgray-100 dark:border-warmgray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-warmgray-900 dark:text-white">
                  {lang === "ar" ? "أرقام المرور السرية (PIN) للموظفين والإدارة" : "Staff & Admin Terminal Security PINs"}
                </h2>
                <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">
                  {lang === "ar"
                    ? "إدارة وتعيين رمز PIN الخاص بالقفل السريع لشاشات الكاشير ونقاط البيع"
                    : "Manage quick lock/unlock PINs for cashiers and managers on POS terminals"}
                </p>
              </div>
            </div>
          </div>

          {isUsersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group 1: Administrators & Managers */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    {lang === "ar" ? "المدراء والمشرفون (ADMIN)" : "Managers & Administrators"}
                  </span>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                    {users?.filter((u) => u.role === "ADMIN").length || 0}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {users
                    ?.filter((u) => u.role === "ADMIN")
                    .map((user) => {
                      const currentPin = user.pinCode;
                      const inputPin = pinInputs[user.id] ?? "";
                      const isVisible = pinVisibility[user.id] ?? false;
                      const isUpdating = updatingPinUserId === user.id;
                      const feedback = pinFeedback[user.id];

                      return (
                        <div
                          key={user.id}
                          className="p-4 rounded-2xl bg-warmgray-50/70 dark:bg-warmgray-800/40 border border-warmgray-200 dark:border-warmgray-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-warmgray-300 dark:hover:border-warmgray-600"
                        >
                          {/* User info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-warmgray-900 dark:text-white truncate">
                                  {user.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800">
                                  {user.role}
                                </span>
                                {user.status === "ACTIVE" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-warmgray-400">Inactive</span>
                                )}
                              </div>
                              <p className="text-xs text-warmgray-500 dark:text-warmgray-400 truncate mt-0.5">
                                {user.email}
                              </p>
                            </div>
                          </div>

                          {/* PIN Controls */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                            {/* Current PIN pill */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-700 text-xs shrink-0">
                              <Lock className="w-3.5 h-3.5 text-warmgray-400" />
                              <span className="text-warmgray-500 text-[11px] font-medium">
                                {lang === "ar" ? "الرمز الحالي:" : "Current:"}
                              </span>
                              {currentPin ? (
                                <span className="font-mono font-bold text-warmgray-900 dark:text-white tracking-widest bg-warmgray-100 dark:bg-warmgray-800 px-1.5 py-0.5 rounded text-xs">
                                  {isVisible ? currentPin : "••••"}
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                  {lang === "ar" ? "غير معين" : "Not set"}
                                </span>
                              )}
                            </div>

                            {/* Input and Buttons */}
                            <div className="flex items-center gap-1.5">
                              <input
                                type={isVisible ? "text" : "password"}
                                maxLength={6}
                                value={inputPin}
                                onChange={(e) => handlePinInputChange(user.id, e.target.value)}
                                placeholder={currentPin ? "New PIN" : "4-digit PIN"}
                                className="w-28 h-9 px-3 py-1.5 text-center font-mono font-bold text-xs bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-warmgray-400"
                              />

                              <button
                                type="button"
                                onClick={() => handleTogglePinVisibility(user.id)}
                                title={isVisible ? "Hide PIN" : "Show PIN"}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-900 text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
                              >
                                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleGenerateRandomPin(user.id)}
                                title={lang === "ar" ? "توليد رمز عشوائي" : "Generate 4-digit PIN"}
                                className="h-9 px-2.5 flex items-center gap-1 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950 transition text-xs font-bold"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[11px]">{lang === "ar" ? "توليد" : "Gen"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSavePin(user.id)}
                                disabled={isUpdating || !inputPin}
                                className={`h-9 px-3 flex items-center gap-1.5 rounded-xl font-bold text-xs text-white transition shadow-sm ${
                                  !inputPin || isUpdating
                                    ? "bg-warmgray-300 dark:bg-warmgray-700 cursor-not-allowed opacity-60"
                                    : "bg-amber-600 hover:bg-amber-700 shadow-amber-900/20"
                                }`}
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>{lang === "ar" ? "حفظ" : "Save"}</span>
                              </button>

                              {currentPin && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePin(user.id)}
                                  disabled={isUpdating}
                                  title={lang === "ar" ? "حذف الرمز" : "Remove PIN"}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {feedback && (
                            <div
                              className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                                feedback.type === "success"
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              }`}
                            >
                              {feedback.type === "success" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              )}
                              <span>{feedback.message}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Group 2: Staff & Cashiers */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-warmgray-700 dark:text-warmgray-300">
                  <UserCheck className="w-4 h-4 text-warmgray-600 dark:text-warmgray-400" />
                  <span>
                    {lang === "ar" ? "طاقم العمل والكاشير (STAFF)" : "Cashiers & Staff Members"}
                  </span>
                  <span className="text-[10px] bg-warmgray-200 dark:bg-warmgray-800 text-warmgray-700 dark:text-warmgray-300 px-2 py-0.5 rounded-full font-bold">
                    {users?.filter((u) => u.role === "STAFF").length || 0}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {users
                    ?.filter((u) => u.role === "STAFF")
                    .map((user) => {
                      const currentPin = user.pinCode;
                      const inputPin = pinInputs[user.id] ?? "";
                      const isVisible = pinVisibility[user.id] ?? false;
                      const isUpdating = updatingPinUserId === user.id;
                      const feedback = pinFeedback[user.id];

                      return (
                        <div
                          key={user.id}
                          className="p-4 rounded-2xl bg-warmgray-50/70 dark:bg-warmgray-800/40 border border-warmgray-200 dark:border-warmgray-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-warmgray-300 dark:hover:border-warmgray-600"
                        >
                          {/* User info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-warmgray-200 text-warmgray-800 dark:bg-warmgray-700 dark:text-warmgray-200 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-warmgray-900 dark:text-white truncate">
                                  {user.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-warmgray-200 dark:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-300">
                                  {user.role}
                                </span>
                                {user.status === "ACTIVE" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-warmgray-400">Inactive</span>
                                )}
                              </div>
                              <p className="text-xs text-warmgray-500 dark:text-warmgray-400 truncate mt-0.5">
                                {user.email}
                              </p>
                            </div>
                          </div>

                          {/* PIN Controls */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                            {/* Current PIN pill */}
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-700 text-xs shrink-0">
                              <Lock className="w-3.5 h-3.5 text-warmgray-400" />
                              <span className="text-warmgray-500 text-[11px] font-medium">
                                {lang === "ar" ? "الرمز الحالي:" : "Current:"}
                              </span>
                              {currentPin ? (
                                <span className="font-mono font-bold text-warmgray-900 dark:text-white tracking-widest bg-warmgray-100 dark:bg-warmgray-800 px-1.5 py-0.5 rounded text-xs">
                                  {isVisible ? currentPin : "••••"}
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                  {lang === "ar" ? "غير معين" : "Not set"}
                                </span>
                              )}
                            </div>

                            {/* Input and Buttons */}
                            <div className="flex items-center gap-1.5">
                              <input
                                type={isVisible ? "text" : "password"}
                                maxLength={6}
                                value={inputPin}
                                onChange={(e) => handlePinInputChange(user.id, e.target.value)}
                                placeholder={currentPin ? "New PIN" : "4-digit PIN"}
                                className="w-28 h-9 px-3 py-1.5 text-center font-mono font-bold text-xs bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-warmgray-400"
                              />

                              <button
                                type="button"
                                onClick={() => handleTogglePinVisibility(user.id)}
                                title={isVisible ? "Hide PIN" : "Show PIN"}
                                className="w-9 h-9 flex items-center justify-center rounded-xl border border-warmgray-200 dark:border-warmgray-700 bg-white dark:bg-warmgray-900 text-warmgray-600 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
                              >
                                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleGenerateRandomPin(user.id)}
                                disabled={isGuest}
                                title={lang === "ar" ? "توليد رمز عشوائي" : "Generate 4-digit PIN"}
                                className="h-9 px-2.5 flex items-center gap-1 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950 transition text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline text-[11px]">{lang === "ar" ? "توليد" : "Gen"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSavePin(user.id)}
                                disabled={isUpdating || !inputPin || isGuest}
                                className={`h-9 px-3 flex items-center gap-1.5 rounded-xl font-bold text-xs text-white transition shadow-sm ${
                                  !inputPin || isUpdating || isGuest
                                    ? "bg-warmgray-300 dark:bg-warmgray-700 cursor-not-allowed opacity-60"
                                    : "bg-amber-600 hover:bg-amber-700 shadow-amber-900/20"
                                }`}
                              >
                                {isUpdating ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                <span>{lang === "ar" ? "حفظ" : "Save"}</span>
                              </button>

                              {currentPin && !isGuest && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePin(user.id)}
                                  disabled={isUpdating}
                                  title={lang === "ar" ? "حذف الرمز" : "Remove PIN"}
                                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {feedback && (
                            <div
                              className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                                feedback.type === "success"
                                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              }`}
                            >
                              {feedback.type === "success" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              )}
                              <span>{feedback.message}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isGuest}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg transition ${
              isGuest
                ? "bg-warmgray-400 text-white cursor-not-allowed opacity-60"
                : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/30"
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isGuest ? "Save Disabled (Guest Mode)" : isSaving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}