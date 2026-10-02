"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useUsers } from "@/hooks/useQueries";
import { useLangStore } from "@/store/langStore";
import { api } from "@/lib/api";
import {
  Users as UsersIcon,
  Plus,
  Shield,
  UserCheck,
  Search,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Edit2,
  ExternalLink,
  Power,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Role, Status, UserWithStats } from "@/types";
import { UserModal } from "@/features/users/UserModal";
import { Pagination } from "@/components/common/Pagination";
import { useAuthStore } from "@/store/authStore";

export default function UsersPage() {
  const { t, lang, dir } = useLangStore();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isGuest = currentUser?.role === "GUEST";
  const { data: users, isLoading } = useUsers();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithStats | null>(null);

  // Compute KPI metrics
  const stats = useMemo(() => {
    if (!users || users.length === 0) {
      return { total: 0, active: 0, totalSales: 0, totalRevenue: 0 };
    }
    const total = users.length;
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const totalSales = users.reduce((sum, u) => sum + (u.totalSales || 0), 0);
    const totalRevenue = users.reduce((sum, u) => sum + (u.totalRevenue || 0), 0);
    return { total, active, totalSales, totalRevenue };
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase().trim();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, statusFilter, search]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const handleOpenAdd = () => {
    if (isGuest) return;
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserWithStats) => {
    if (isGuest) return;
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (data: {
    name: string;
    email: string;
    role: Role;
    status?: Status;
    password?: string;
  }) => {
    if (isGuest) return;
    if (editingUser) {
      await api.patch(`/users/${editingUser.id}`, {
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        ...(data.password ? { passwordPlain: data.password } : {}),
      });
    } else {
      await api.post("/users", {
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const handleToggleStatus = async (user: UserWithStats) => {
    if (isGuest) return;
    try {
      await api.patch(`/users/${user.id}/status`, {
        status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: any) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  // Helper for user avatar initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-warmgray-900 dark:text-white tracking-tight">
            {t.users.title}
          </h1>
          <p className="text-xs sm:text-sm text-warmgray-600 dark:text-warmgray-400 mt-1 font-medium">
            Manage team access, roles, performance records, and cashier accounts
          </p>
        </div>

        {!isGuest && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-900/30 transition active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t.users.addUser}</span>
          </button>
        )}
      </div>

      {/* Executive Team KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400">Total Staff</p>
            <p className="text-2xl font-black text-warmgray-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Active Cashiers */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400">Active Staff</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.active}
            </p>
          </div>
        </div>

        {/* Orders Processed */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400">Sales Processed</p>
            <p className="text-2xl font-black text-warmgray-900 dark:text-white mt-0.5">
              {stats.totalSales}
            </p>
          </div>
        </div>

        {/* Revenue Generated */}
        <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-warmgray-700 dark:text-warmgray-400">Revenue Handled</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {stats.totalRevenue.toFixed(0)}{" "}
              <span className="text-xs font-bold text-warmgray-600 dark:text-warmgray-400">SAR</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-warmgray-900 border border-warmgray-200 dark:border-warmgray-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Filter and Search Bar */}
        <div className="p-4 sm:p-5 border-b border-warmgray-100 dark:border-warmgray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-warmgray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email..."
              className="w-full ps-10 pe-4 py-2.5 bg-warmgray-50 dark:bg-warmgray-950 border border-warmgray-200 dark:border-warmgray-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <div className="flex items-center bg-warmgray-100 dark:bg-warmgray-800 p-1 rounded-2xl text-xs">
              <button
                onClick={() => setRoleFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  roleFilter === "ALL"
                    ? "bg-white dark:bg-warmgray-900 text-amber-600 shadow-sm"
                    : "text-warmgray-700 hover:text-warmgray-900 dark:text-warmgray-300 dark:hover:text-white"
                }`}
              >
                All Roles
              </button>
              <button
                onClick={() => setRoleFilter("ADMIN")}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  roleFilter === "ADMIN"
                    ? "bg-white dark:bg-warmgray-900 text-amber-600 shadow-sm"
                    : "text-warmgray-700 hover:text-warmgray-900 dark:text-warmgray-300 dark:hover:text-white"
                }`}
              >
                Admins
              </button>
              <button
                onClick={() => setRoleFilter("STAFF")}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  roleFilter === "STAFF"
                    ? "bg-white dark:bg-warmgray-900 text-amber-600 shadow-sm"
                    : "text-warmgray-700 hover:text-warmgray-900 dark:text-warmgray-300 dark:hover:text-white"
                }`}
              >
                Staff
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-warmgray-100 dark:bg-warmgray-800 p-1 rounded-2xl text-xs">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  statusFilter === "ALL"
                    ? "bg-white dark:bg-warmgray-900 text-amber-600 shadow-sm"
                    : "text-warmgray-700 hover:text-warmgray-900 dark:text-warmgray-300 dark:hover:text-white"
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  statusFilter === "ACTIVE"
                    ? "bg-white dark:bg-warmgray-900 text-emerald-600 shadow-sm"
                    : "text-warmgray-700 hover:text-warmgray-900 dark:text-warmgray-300 dark:hover:text-white"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("INACTIVE")}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  statusFilter === "INACTIVE"
                    ? "bg-white dark:bg-warmgray-900 text-red-600 shadow-sm"
                    : "text-warmgray-700 hover:text-warmgray-900 dark:text-warmgray-300 dark:hover:text-white"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-warmgray-50 dark:bg-warmgray-950/80 text-warmgray-700 dark:text-warmgray-300 font-bold border-b border-warmgray-200 dark:border-warmgray-800 sticky top-0 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-5 text-start">Member</th>
                <th className="py-3.5 px-4 text-start">Role</th>
                <th className="py-3.5 px-4 text-start">Status</th>
                <th className="py-3.5 px-4 text-start">Sales Count</th>
                <th className="py-3.5 px-4 text-start">Revenue Generated</th>
                <th className="py-3.5 px-4 text-start">Joined</th>
                <th className="py-3.5 px-5 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmgray-100 dark:divide-warmgray-800/80">
              {isLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-5 px-5">
                      <div className="h-6 bg-warmgray-100 dark:bg-warmgray-800 rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                paginatedUsers.map((u) => {
                  const initials = getInitials(u.name);
                  const isUserActive = u.status === "ACTIVE";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-warmgray-50/70 dark:hover:bg-warmgray-800/40 transition group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0">
                            {initials}
                          </div>
                          <div>
                            <Link
                              href={`/users/${u.id}`}
                              className="font-black text-sm text-warmgray-900 dark:text-white hover:text-amber-600 transition flex items-center gap-1.5"
                            >
                              <span>{u.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
                            </Link>
                            <p className="text-[11px] text-warmgray-600 dark:text-warmgray-400 font-medium">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40"
                          }`}
                        >
                          {u.role === "ADMIN" ? (
                            <Shield className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                            isUserActive
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isUserActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                            }`}
                          />
                          <span>{isUserActive ? "Active" : "Inactive"}</span>
                        </span>
                      </td>

                      {/* Sales Count */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-warmgray-500 dark:text-warmgray-400" />
                          <span className="font-bold text-xs text-warmgray-800 dark:text-warmgray-200">
                            {u.totalSales || 0} orders
                          </span>
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="py-4 px-4">
                        <div className="font-black text-sm text-amber-600 dark:text-amber-400">
                          {(u.totalRevenue || 0).toFixed(2)}{" "}
                          <span className="text-[10px] font-bold text-warmgray-600 dark:text-warmgray-400">SAR</span>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-warmgray-600 dark:text-warmgray-400 font-medium text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail Link */}
                          <Link
                            href={`/users/${u.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-warmgray-100 hover:bg-warmgray-200 dark:bg-warmgray-800 dark:hover:bg-warmgray-700 text-warmgray-700 dark:text-warmgray-300 text-xs font-bold transition"
                            title="View Sales & Performance"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </Link>

                          {/* Edit User Button */}
                          {!isGuest && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition"
                                title="Edit User"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Status Button */}
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`p-1.5 rounded-xl transition ${
                                  isUserActive
                                    ? "bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
                                    : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                                }`}
                                title={isUserActive ? "Deactivate User" : "Activate User"}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-warmgray-400">
                    <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-bold text-sm text-warmgray-700 dark:text-warmgray-300">
                      No team members found
                    </p>
                    <p className="text-xs text-warmgray-600 dark:text-warmgray-400 font-medium mt-1">
                      Try adjusting your search criteria or add a new team member
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredUsers.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 15, 25, 50]}
          />
        )}
      </div>

      {/* User Modal for Add / Edit */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />
    </div>
  );
}