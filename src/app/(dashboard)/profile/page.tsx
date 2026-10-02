"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";
import { api } from "@/lib/api";
import { User as UserIcon, Lock, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { t } = useLangStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setIsChanging(true);
    setError(null);
    setSuccess(false);

    try {
      await api.patch("/auth/password", {
        currentPassword,
        newPassword,
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-xl w-full mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-warmgray-900 dark:text-white tracking-tight">
          {t.nav.profile}
        </h1>
        <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-1">Your user details and credentials</p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white dark:bg-warmgray-900 rounded-3xl p-6 border border-warmgray-200 dark:border-warmgray-800 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 flex items-center justify-center font-black text-xl">
          {user?.name?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 className="text-base font-bold text-warmgray-900 dark:text-white leading-tight">
            {user?.name}
          </h2>
          <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium">{user?.email}</p>
          <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Role: {user?.role}
          </span>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="bg-white dark:bg-warmgray-900 rounded-3xl p-6 border border-warmgray-200 dark:border-warmgray-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm border-b border-warmgray-100 dark:border-warmgray-800 pb-3">
          <Lock className="w-4 h-4" />
          <span>Change Password</span>
        </div>

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Password updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-warmgray-800 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isChanging}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/30 transition"
            >
              {isChanging ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}