"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function RootPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role === "ADMIN") {
        router.replace("/dashboard");
      } else {
        router.replace("/pos");
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#18110B]">
      <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}