"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { ROLE_LABEL } from "@/lib/constants";
import { ROLE_NAV } from "./nav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;
  const navItems = ROLE_NAV[user.role] ?? [];

  const isActive = (href: string) => {
    const base = `/${user.role === "school_admin" ? "school-admin" : user.role === "health_care_staff" ? "health-care" : user.role === "nutrition_staff" ? "nutrition" : user.role}`;
    if (href === base) return pathname === base;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {mobileOpen && (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link href="/" className="flex items-center gap-2 border-b border-slate-100 px-5 py-5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            K
          </span>
          <div>
            <p className="text-base font-bold text-slate-900">KidsLink</p>
            <p className="text-xs text-slate-400">{ROLE_LABEL[user.role]}</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive(item.href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <span aria-hidden className="text-base">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            aria-label="Mở menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>

          <div className="hidden text-sm text-slate-500 lg:block">
            Xin chào, <span className="font-medium text-slate-800">{user.full_name}</span>
          </div>

          <div className="relative ml-auto">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
            >
              <Avatar name={user.full_name} url={user.avatar_url} />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium text-slate-800">{user.full_name}</p>
                <p className="text-xs text-slate-400">{ROLE_LABEL[user.role]}</p>
              </div>
            </button>

            {menuOpen && (
              <>
                <button
                  aria-label="Đóng"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-2">
                    <p className="truncate text-sm font-medium text-slate-800">{user.full_name}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function Avatar({ name, url, size = "md" }: { name: string; url?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-16 text-xl" };
  const initial = name?.trim()?.charAt(0)?.toUpperCase() ?? "?";

  if (url) {
    // Ảnh từ MinIO hoặc URL ngoài — dùng <img> để tránh cấu hình domain.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        className={clsx(sizes[size], "rounded-full object-cover ring-2 ring-white")}
      />
    );
  }

  return (
    <span
      className={clsx(
        sizes[size],
        "flex items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700",
      )}
    >
      {initial}
    </span>
  );
}
