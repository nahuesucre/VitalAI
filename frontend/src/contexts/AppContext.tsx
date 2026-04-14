"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { t as translate } from "@/lib/i18n";

interface AppContextType {
  dark: boolean;
  toggleDark: () => void;
  locale: Locale;
  toggleLocale: () => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType>({
  dark: false,
  toggleDark: () => {},
  locale: "es",
  toggleLocale: () => {},
  t: (key: string) => key,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");

  // Restore preferences from localStorage
  useEffect(() => {
    const savedDark = localStorage.getItem("vitalai-dark");
    const savedLocale = localStorage.getItem("vitalai-locale") as Locale | null;
    if (savedDark === "true") setDark(true);
    if (savedLocale === "en" || savedLocale === "es") setLocale(savedLocale);
  }, []);

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("vitalai-dark", String(dark));
  }, [dark]);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem("vitalai-locale", locale);
  }, [locale]);

  function toggleDark() {
    setDark((prev) => !prev);
  }

  function toggleLocale() {
    setLocale((prev) => (prev === "es" ? "en" : "es"));
  }

  function t(key: string) {
    return translate(key, locale);
  }

  return (
    <AppContext.Provider value={{ dark, toggleDark, locale, toggleLocale, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
