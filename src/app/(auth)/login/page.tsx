"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Coffee,
  Globe,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";
import { useBusiness } from "@/hooks/useQueries";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/env";
import { CoffeeAnimation } from "./CoffeeAnimation";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { lang, toggleLang, t } = useLangStore();
  const { data: business } = useBusiness();

  const isArabic = lang === "ar";
  const defaultBusinessName = isArabic ? "مقهى أروما للقهوة المختصة" : "MK Coffee Riyadh";
  const businessName =
    isArabic
      ? business?.nameAr || business?.nameEn || defaultBusinessName
      : business?.nameEn || business?.nameAr || defaultBusinessName;

  const logoUrl = business?.logoUrl ? getMediaUrl(business.logoUrl) : "/logo.png";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading || isGuestLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post<{ token: string; user: any }>("/auth/login", {
        email,
        password,
      });

      setAuth(res.user, res.token);
      router.replace("/pos");
    } catch (err: any) {
      setError(err.message || t.auth.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (isLoading || isGuestLoading) return;
    setIsGuestLoading(true);
    setError(null);

    try {
      const res = await api.post<{ token: string; user: any }>("/auth/guest-login");
      setAuth(res.user, res.token);
      router.replace("/pos");
    } catch (err: any) {
      setError(err.message || (isArabic ? "تعذر الدخول كزائر" : "Failed to log in as guest"));
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail("admin@example.com");
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden flex flex-col lg:flex-row bg-[#120B07] text-warmgray-900 font-sans select-none">
      {/* ======================================================== */}
      {/* SIDE 1: BRAND SHOWCASE & ANIMATED COFFEE ART (Left / Side) */}
      {/* ======================================================== */}
      <div className="relative w-full lg:w-[50%] xl:w-[52%] h-auto lg:h-full max-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 xl:p-10 bg-gradient-to-br from-[#1A0E08] via-[#140B06] to-[#0D0603] text-warmgray-100 overflow-hidden border-b lg:border-b-0 lg:border-e border-amber-900/30 shrink-0 lg:shrink">
        {/* Subtle Ambient Background Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.15),rgba(255,255,255,0))] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-amber-900/10 blur-[90px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-72 h-72 rounded-full bg-amber-600/10 blur-[80px] pointer-events-none" />

        {/* Top Header: Business Identity & Status */}
        <div className="relative z-10 flex items-center justify-between w-full shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-md shadow-amber-900/40 shrink-0">
              <div className="w-full h-full rounded-[10px] sm:rounded-[13px] bg-[#1A0E08] flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={businessName}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target && !target.src.endsWith("/logo.png")) {
                        target.src = "/logo.png";
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Coffee className="w-5 h-5 text-amber-400" />
                )}
              </div>
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-white tracking-tight leading-tight">
                {businessName}
              </h1>
              <p className="text-[11px] text-amber-400/90 font-medium">
                {isArabic ? "نظام كاشير القهوة المختصة" : "Specialty Coffee POS Terminal"}
              </p>
            </div>
          </div>

          {/* Live POS Status Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] text-amber-200/90 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>{isArabic ? "نظام متصل وجاهز" : "Terminal Online"}</span>
          </div>
        </div>

        {/* Center Hero: Animated Coffee Piece & Brand Story */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center min-h-0 py-2 sm:py-3">
          {/* Animated Coffee Element */}
          <CoffeeAnimation />

          {/* Tagline & Description */}
          <div className="max-w-md mx-auto space-y-2 px-2 mt-1 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-semibold tracking-wide">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>
                {isArabic ? "مصمم لمحترفي القهوة والباريستا" : "Crafted for Artisan Coffee Bars"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              {isArabic ? (
                <>
                  سرعة في الخدمة، <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">ودقة في كل كوب</span>
                </>
              ) : (
                <>
                  Brewed for Speed, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">Crafted for Precision</span>
                </>
              )}
            </h2>

            <p className="text-xs text-warmgray-300/90 leading-relaxed max-w-sm mx-auto hidden sm:block">
              {isArabic
                ? "نظام كاشير فائق السرعة، مزامنة فورية مع المطبخ، ومطابقة دقيقة للورديات."
                : "Ultra-fast counter checkout, live kitchen display coordination, and recipe depletion."}
            </p>
          </div>

          {/* Feature Highlights Pills */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-sm sm:max-w-md mt-3 sm:mt-4 pt-3 border-t border-white/10 shrink-0">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.04] border border-white/5 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
              <span className="text-[11px] font-bold text-white">
                {isArabic ? "طلب بـ ثانيتين" : "2s Checkout"}
              </span>
              <span className="text-[10px] text-warmgray-400">
                {isArabic ? "كاشير فوري" : "Express POS"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.04] border border-white/5 backdrop-blur-sm">
              <Coffee className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
              <span className="text-[11px] font-bold text-white">
                {isArabic ? "وصفات الحبوب" : "Recipe BOM"}
              </span>
              <span className="text-[10px] text-warmgray-400">
                {isArabic ? "خصم المخزون" : "Auto Deduct"}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.04] border border-white/5 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
              <span className="text-[11px] font-bold text-white">
                {isArabic ? "إقفال الوردية" : "Shift Audit"}
              </span>
              <span className="text-[10px] text-warmgray-400">
                {isArabic ? "مطابقة النقد" : "Z-Report"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Operational Indicator */}
        <div className="relative z-10 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-warmgray-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{isArabic ? "نظام الكاشير v2.4" : "POS Core v2.4"}</span>
          </div>
          <div>
            {isArabic ? "جاهز للطباعة الحرارية الصامتة" : "Silent Thermal Ready"}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SIDE 2: AUTHENTICATION & CASHIER LOGIN FORM (Right Side) */}
      {/* ======================================================== */}
      <div className="w-full lg:w-[50%] xl:w-[48%] h-full max-h-screen flex flex-col justify-between py-10  px-10 bg-[#FAF8F5] overflow-hidden shrink-0 lg:shrink">
        {/* Top Control Bar: Language Switcher & Terminal Tag */}
        <div className="flex items-center justify-between w-full shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-100/70 border border-amber-200 text-amber-800 text-[10px] font-bold tracking-wider uppercase">
              {isArabic ? "نقطة الدخول" : "GATEWAY"}
            </span>
            <span className="text-[11px] text-warmgray-400 font-medium">
              {isArabic ? "محطة رئيسية #01" : "Terminal #01"}
            </span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-warmgray-200/90 bg-white hover:bg-warmgray-50 text-warmgray-700 transition shadow-sm hover:border-amber-400 active:scale-95"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === "en" ? "العربية" : "English"}</span>
          </button>
        </div>

        {/* Center: Clean, Compact Form Card */}
        <div className="flex-1 flex flex-col justify-center min-h-0 py-2 sm:py-3">
          <div className="w-full max-w-sm sm:max-w-xl mx-auto bg-white border border-warmgray-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 shadow-xl shadow-warmgray-200/60 space-y-3.5 sm:space-y-4">
            {/* Header */}
            <div className="space-y-1">
              {/* <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 shadow-inner mb-2.5">
                <Coffee className="w-5 h-5 text-amber-600" />
              </div> */}

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-warmgray-900 leading-tight">
                {t.auth.welcome || (isArabic ? "مرحباً بعودتك" : "Welcome Back")}
              </h2>
              <p className="text-xs text-warmgray-500 leading-normal">
                {t.auth.subtitle ||
                  (isArabic
                    ? "سجّل الدخول إلى محطة الكاشير لبدء الخدمة"
                    : "Sign in to access your cashier terminal")}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-medium leading-tight">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-warmgray-700 mb-1">
                  {t.auth.email}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-400" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full ps-10 pe-4 py-2 sm:py-2.5 bg-warmgray-50/70 border border-warmgray-200 rounded-xl text-xs sm:text-sm text-warmgray-900 placeholder-warmgray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-warmgray-700">
                    {t.auth.password}
                  </label>
                  <button
                    type="button"
                    onClick={handleQuickDemoFill}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    {isArabic ? "تعبئة تجريبية" : "Demo credentials"}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-10 pe-11 py-2 sm:py-2.5 bg-warmgray-50/70 border border-warmgray-200 rounded-xl text-xs sm:text-sm text-warmgray-900 placeholder-warmgray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-warmgray-400 hover:text-amber-600 p-1 rounded-lg transition"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-warmgray-500 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {isArabic
                    ? "جلسة اتصال مشفرة ومحمية ببروتوكول آمن"
                    : "Encrypted cashier session with secure token"}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isGuestLoading}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white shadow-lg shadow-amber-600/20 hover:shadow-amber-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t.auth.signIn}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Guest / Demo Access */}
            <div className="pt-2.5 border-t border-warmgray-100 space-y-2">
              <div className="relative flex items-center justify-center">
                <span className="text-[10px] text-warmgray-400 font-semibold uppercase tracking-wider bg-white px-2">
                  {isArabic ? "أو تجربة النظام كزائر" : "Or Explore Without Account"}
                </span>
              </div>
              <button
                type="button"
                disabled={isLoading || isGuestLoading}
                onClick={handleGuestLogin}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-warmgray-50 hover:bg-amber-50/50 text-warmgray-700 hover:text-amber-900 border border-warmgray-200 hover:border-amber-400 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isGuestLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      {isArabic
                        ? "الدخول كزائر (وضع العرض فقط)"
                        : "Explore as Guest (View-Only)"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-warmgray-400 pt-2 flex flex-col sm:flex-row items-center justify-between gap-1 border-t border-warmgray-200/60 shrink-0">
          <span>{businessName}</span>
          <div className="flex items-center gap-2 text-[10px]">
            <span>{isArabic ? "نظام كاشير فوري" : "Express Counter POS"}</span>
            <span>&bull;</span>
            <span>{isArabic ? "ثنائي اللغة عربي / إنجليزي" : "Bilingual EN / AR"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}