"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getMe } from "@/lib/auth";
import Sidebar from "./Sidebar";
import type { User } from "@/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    getMe()
      .then((u) => { if (!cancelled) setUser(u); })
      .catch(() => { if (!cancelled) router.push("/login"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sky-500 text-sm font-medium">Cargando VitalAI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-sky-50/60">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-sky-100 flex items-center justify-end px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-300 to-sky-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-600 font-medium">{user?.full_name}</span>
            <span className="px-2.5 py-1 bg-sky-50 text-sky-600 text-xs rounded-full font-semibold capitalize border border-sky-100">
              {user?.role_name}
            </span>
          </div>
        </header>
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}
