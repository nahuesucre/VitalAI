"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getMe } from "@/lib/auth";
import { useApp } from "@/contexts/AppContext";
import Sidebar from "./Sidebar";
import type { User } from "@/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggleDark, locale, toggleLocale, t } = useApp();
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-app)" }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sky-500 text-sm font-medium">{t("common.loadingApp")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-app)" }}>
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
              aria-label={t("header.openMenu")}
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
                aria-label={t("nav.expand")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Right: toggles + user info */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="px-2 py-1 rounded-lg text-xs font-bold border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition-colors text-gray-500"
              title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
            >
              {locale === "es" ? "EN" : "ES"}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-lg text-gray-400 hover:text-sky-500 hover:bg-sky-50 transition-colors"
              title={dark ? (locale === "es" ? "Modo claro" : "Light mode") : (locale === "es" ? "Modo oscuro" : "Dark mode")}
            >
              {dark ? (
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-200" />

            {/* User info */}
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
