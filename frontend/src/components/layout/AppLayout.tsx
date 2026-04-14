"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getMe } from "@/lib/auth";
import Sidebar from "./Sidebar";
import type { User } from "@/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  // Restore sidebar preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

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

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f0f9ff" }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sky-500 text-sm font-medium">Cargando VitalAI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f0f9ff" }}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={toggleCollapsed}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-sky-100 flex items-center justify-between px-4 md:px-6 shadow-sm shrink-0">
          {/* Left: hamburger (mobile) + expand button (desktop collapsed) */}
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-sky-500 hover:bg-sky-50 transition-colors"
              aria-label="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop: expand button only when collapsed */}
            {collapsed && (
              <button
                onClick={toggleCollapsed}
                className="hidden md:flex p-2 rounded-lg text-gray-400 hover:text-sky-500 hover:bg-sky-50 transition-colors"
                aria-label="Expandir menú"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Right: user info */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-300 to-sky-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm text-gray-600 font-medium truncate max-w-[140px]">{user?.full_name}</span>
            <span className="px-2 py-1 bg-sky-50 text-sky-600 text-xs rounded-full font-semibold capitalize border border-sky-100 whitespace-nowrap">
              {user?.role_name}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
