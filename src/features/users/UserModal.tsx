"use client";

import React, { useEffect, useState } from "react";
import { User, Role, Status } from "@/types";
import { useLangStore } from "@/store/langStore";
import { X, Shield, UserCheck, Key, Mail, User as UserIcon } from "lucide-react";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    email: string;
    role: Role;
    status?: Status;
    password?: string;
  }) => Promise<void>;
  editingUser?: User | null;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
}) => {
  const { t } = useLangStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STAFF");
  const [status, setStatus] = useState<Status>("ACTIVE");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || "");
      setEmail(editingUser.email || "");
      setRole(editingUser.role || "STAFF");
      setStatus(editingUser.status || "ACTIVE");
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
      setStatus("ACTIVE");
    }
    setError(null);
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("Name and Email are required");
      return;
    }

    if (!editingUser && (!password || password.length < 6)) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (editingUser && password && password.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        status,
        ...(password.trim() ? { password: password.trim() } : {}),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-warmgray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-warmgray-200 dark:border-warmgray-800 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-warmgray-100 dark:border-warmgray-800">
          <div>
            <h3 className="font-black text-base text-warmgray-900 dark:text-white">
              {editingUser ? "Edit User Account" : t.users.addUser}
            </h3>
            <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-0.5">
              {editingUser
                ? `Update permissions and details for ${editingUser.name}`
                : "Register a new staff member or administrator"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-warmgray-500 hover:text-warmgray-800 dark:text-warmgray-400 hover:bg-warmgray-100 dark:hover:bg-warmgray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.users.name} *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sara Barista"
              className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800/80 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.users.email} *</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@example.com"
              className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800/80 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.users.role} *</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole("STAFF")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                  role === "STAFF"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-warmgray-50 dark:bg-warmgray-800/80 border-warmgray-200 dark:border-warmgray-700 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-700"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{t.users.staff}</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                  role === "ADMIN"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-warmgray-50 dark:bg-warmgray-800/80 border-warmgray-200 dark:border-warmgray-700 text-warmgray-700 dark:text-warmgray-300 hover:bg-warmgray-100 dark:hover:bg-warmgray-700"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>{t.users.admin}</span>
              </button>
            </div>
          </div>

          {/* Status Selection (only for editing) */}
          {editingUser && (
            <div>
              <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5">
                Account Status
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatus("ACTIVE")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    status === "ACTIVE"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-warmgray-50 dark:bg-warmgray-800/80 border-warmgray-200 dark:border-warmgray-700 text-warmgray-700 dark:text-warmgray-300"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("INACTIVE")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    status === "INACTIVE"
                      ? "bg-red-600 text-white border-red-600 shadow-sm"
                      : "bg-warmgray-50 dark:bg-warmgray-800/80 border-warmgray-200 dark:border-warmgray-700 text-warmgray-700 dark:text-warmgray-300"
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          )}

          {/* Password / Password Reset */}
          <div>
            <label className="block text-xs font-bold text-warmgray-700 dark:text-warmgray-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>{editingUser ? "Reset Password (Optional)" : `${t.users.password} *`}</span>
              </span>
              {editingUser && (
                <span className="text-[10px] text-warmgray-600 dark:text-warmgray-400 font-medium">
                  Leave blank to keep current
                </span>
              )}
            </label>
            <input
              type="password"
              minLength={6}
              required={!editingUser}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editingUser ? "New password (min 6 characters)" : "At least 6 characters"}
              className="w-full px-3.5 py-2.5 bg-warmgray-50 dark:bg-warmgray-800/80 border border-warmgray-200 dark:border-warmgray-700 rounded-xl text-xs font-medium text-warmgray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-warmgray-100 dark:border-warmgray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-warmgray-100 hover:bg-warmgray-200 text-warmgray-700 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 dark:text-warmgray-300 transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/30 transition disabled:opacity-50"
            >
              {isSaving ? "Saving..." : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
