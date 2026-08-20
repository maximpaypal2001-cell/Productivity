"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(app)/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Дашборд" },
  { href: "/items", label: "Товары" },
  { href: "/expenses", label: "Расходы" },
  { href: "/documents", label: "Документы" },
  { href: "/reports", label: "Отчёты" },
  { href: "/profile", label: "Профиль" },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function NavBar({ userLabel }: { userLabel: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:border-r md:border-slate-200 md:bg-white">
        <div className="px-5 py-5">
          <p className="text-lg font-semibold text-slate-900">Учёт самозанятого</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(pathname, item.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-4 py-4">
          <p className="mb-2 truncate text-xs text-slate-500">{userLabel}</p>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost w-full justify-start px-3 py-1.5 text-sm">
              Выйти
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-base font-semibold text-slate-900">Учёт самозанятого</p>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-slate-500">
              Выйти
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 font-medium ${
                isActive(pathname, item.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
