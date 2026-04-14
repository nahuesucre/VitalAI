import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VitalAI",
  description: "Plataforma de operaciones clínicas asistida por IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans" style={{ backgroundColor: "var(--bg-app)", color: "var(--fg-app)" }}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
