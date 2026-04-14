"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { useApp } from "@/contexts/AppContext";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@trialflow.ai");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { t, dark, toggleDark, locale, toggleLocale } = useApp();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch {
      setError(t("login.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-100/60 rounded-full blur-3xl" />
      </div>

      {/* Top-right toggles */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={toggleLocale}
          className="px-2 py-1 rounded-lg text-xs font-bold border border-gray-200 hover:border-sky-300 hover:bg-sky-50 transition-colors text-gray-500 cursor-pointer"
          title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
        >
          {locale === "es" ? "EN" : "ES"}
        </button>
        <button
          onClick={toggleDark}
          className="p-1.5 rounded-lg text-gray-400 hover:text-sky-500 hover:bg-sky-50 transition-colors cursor-pointer"
          title={dark ? (locale === "es" ? "Modo claro" : "Light mode") : (locale === "es" ? "Modo oscuro" : "Dark mode")}
        >
          {dark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>
      </div>

      <div className="relative w-full max-w-md p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-sky-100">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="VitalAI" className="h-20 object-contain" />
          </div>
          <p className="text-gray-400 text-sm">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("login.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent placeholder-gray-300 transition-shadow"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("login.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent placeholder-gray-300 transition-shadow"
              required
            />
          </div>
          {error && (
            <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-500 hover:to-cyan-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {t("login.loading")}
              </span>
            ) : t("login.submit")}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-300">
          Demo: admin@trialflow.ai / password123
        </div>
      </div>
    </div>
  );
}
