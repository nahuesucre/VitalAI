"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>
  )},
  { href: "/studies", label: "Estudios", icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
  )},
  { href: "/screening", label: "Screening", icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
  )},
  { href: "/visits", label: "Visitas", icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
  )},
  { href: "/chat", label: "Copiloto IA", icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
  )},
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (isMobile = false) => (
    <aside
      className={`
        bg-white border-r border-sky-100 flex flex-col shadow-sm h-full
        sidebar-transition overflow-hidden
        ${isMobile ? "w-64" : collapsed ? "w-16" : "w-56"}
      `}
    >
      {/* Logo + toggle */}
      <div className={`border-b border-sky-100 flex items-center ${collapsed && !isMobile ? "justify-center px-0 py-4" : "px-4 py-4"}`}>
        {collapsed && !isMobile ? (
          <button onClick={onToggle} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sky-50 transition-colors" title="Expandir menú">
            <img src="/logo-mark.png" alt="VitalAI" className="h-7 w-7 object-contain" />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <img src="/logo-mark.png" alt="VitalAI" className="h-8 w-8 object-contain shrink-0" />
              <span className="text-lg font-bold tracking-tight whitespace-nowrap">
                <span className="text-sky-400">Vital</span><span className="text-sky-600 font-black">AI</span>
              </span>
            </div>
            {!isMobile && (
              <button
                onClick={onToggle}
                className="p-1 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-500 transition-colors ml-1"
                title="Colapsar menú"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            )}
            {isMobile && (
              <button onClick={onMobileClose} className="p-1 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-3 space-y-0.5 ${collapsed && !isMobile ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          if (collapsed && !isMobile) {
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex items-center justify-center p-2.5 rounded-lg transition-colors ${
                  isActive ? "bg-sky-50 text-sky-500 border border-sky-100" : "text-gray-400 hover:text-sky-500 hover:bg-sky-50"
                }`}
              >
                {item.icon}
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={isMobile ? onMobileClose : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-sky-50 text-sky-700 border border-sky-100" : "text-gray-500 hover:text-gray-800 hover:bg-sky-50"
              }`}
            >
              <span className={isActive ? "text-sky-500" : "text-gray-400"}>{item.icon}</span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-sky-100 py-3 ${collapsed && !isMobile ? "px-2" : "px-3"}`}>
        <button
          onClick={logout}
          title="Cerrar sesión"
          className={`w-full flex items-center text-sm text-gray-400 hover:text-gray-700 hover:bg-sky-50 rounded-lg transition-colors ${
            collapsed && !isMobile ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
          }`}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
          {(!collapsed || isMobile) && <span className="whitespace-nowrap">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0 sidebar-transition" style={{ width: collapsed ? 64 : 224 }}>
        {sidebarContent(false)}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 z-50">
            {sidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
