import Link from "next/link";
import { LayoutDashboard, List, KanbanSquare, Map, Users, LogOut, Plus } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";
import type { CurrentUser } from "@/lib/dal";

export default function TopBar({ user }: { user: CurrentUser }) {
  const links = [
    { href: "/prospects", label: "Prospects", icon: List },
    { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
    { href: "/map", label: "Map", icon: Map },
    ...(user.role === "admin"
      ? [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/admin/users", label: "Users", icon: Users },
        ]
      : []),
  ];

  return (
    <header className="hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/prospects" className="text-lg font-bold text-slate-900 dark:text-white">
            Overtake
          </Link>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/prospects/new"
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            New prospect
          </Link>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {user.full_name}{" "}
            <span className="text-slate-400 dark:text-slate-500">· {user.role === "admin" ? "Admin" : "Rep"}</span>
          </span>
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
