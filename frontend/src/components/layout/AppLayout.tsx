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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-8">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.full_name}</span>
            <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs rounded-full font-medium capitalize">
              {user?.role_name}
            </span>
          </div>
        </header>
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}
