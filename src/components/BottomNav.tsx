"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, KanbanSquare, Map, LayoutDashboard, Plus } from "lucide-react";

export default function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const items = [
    { href: "/prospects", label: "Prospects", icon: List },
    { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
    { href: "/map", label: "Map", icon: Map },
    ...(isAdmin ? [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                active ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
        <Link
          href="/prospects/new"
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-slate-500 dark:text-slate-400"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-white">
            <Plus size={18} />
          </span>
          New
        </Link>
      </div>
    </nav>
  );
}
