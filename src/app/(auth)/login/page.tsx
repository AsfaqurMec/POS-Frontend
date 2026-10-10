"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Globe, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";
import { useBusiness } from "@/hooks/useQueries";
import { api } from "@/lib/api";
import { getMediaUrl } from "@/lib/env";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { lang, toggleLang, t } = useLangStore();
  const { data: business } = useBusiness();

  const defaultBusinessName = lang === "ar" ? "مقهى أروما للقهوة المختصة" : "MK Coffee Riyadh";
  const businessName =
    lang === "ar"
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
      setError(err.message || "Failed to log in as guest");
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-warmgray-50 via-coffee-50 to-amber-50 text-warmgray-900 relative p-4 sm:p-8">
      {/* Top Bar with Language Toggle */}
      <div className="flex justify-between items-center w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-600 border border-amber-500/40 flex items-center justify-center text-white shadow-lg shadow-amber-200 overflow-hidden shrink-0">
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
              <Coffee className="w-5 h-5" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-tight text-warmgray-900">{businessName}</h1>
            <span className="text-[11px] text-amber-600">
              {lang === "ar" ? "نظام نقاط البيع" : "Point of Sale Terminal"}
            </span>
          </div>
        </div>

        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-warmgray-200 bg-white hover:bg-warmgray-50 text-warmgray-700 transition shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-amber-600" />
          <span>{lang === "en" ? "العربية" : "English"}</span>
        </button>
      </div>

      {/* Center Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-white border border-warmgray-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-warmgray-200/80 space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-black tracking-tight text-warmgray-900">{businessName}</h2>
            <p className="text-xs text-warmgray-500">{t.auth.subtitle}</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-warmgray-600 mb-1.5">
                {t.auth.email}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full ps-10 pe-4 py-2.5 bg-warmgray-50 border border-warmgray-200 rounded-xl text-sm text-warmgray-900 placeholder-warmgray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-warmgray-600 mb-1.5">
                {t.auth.password}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full ps-10 pe-10 py-2.5 bg-warmgray-50 border border-warmgray-200 rounded-xl text-sm text-warmgray-900 placeholder-warmgray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-warmgray-400 hover:text-amber-600 transition"
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

            <button
              type="submit"
              disabled={isLoading || isGuestLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-200 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.auth.signIn}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Guest Mode Access */}
          <div className="pt-2 border-t border-warmgray-100">
            <div className="relative flex items-center justify-center mb-3">
              <span className="text-[11px] text-warmgray-400 font-medium">
                {lang === "ar" ? "أو الدخول للتجربة فقط" : "Or explore system without an account"}
              </span>
            </div>
            <button
              type="button"
              disabled={isLoading || isGuestLoading}
              onClick={handleGuestLogin}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-warmgray-50 hover:bg-warmgray-100 text-warmgray-600 hover:text-warmgray-800 border border-warmgray-200 hover:border-amber-400 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              {isGuestLoading ? (
                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>{lang === "ar" ? "الدخول كزائر (وضع العرض فقط)" : "Explore as Guest (View-Only)"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-warmgray-400">
        {businessName} &bull; {lang === "ar" ? "نظام كاشير سريع" : "Fast Counter Checkout"} &bull; {lang === "ar" ? "ثنائي اللغة عربي/إنجليزي" : "Bilingual EN/AR"}
      </div>
    </div>
  );
}