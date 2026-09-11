import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";

export default function MobileHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
      <h1 className="text-base font-bold text-slate-900 dark:text-white">{title}</h1>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <form action={logout}>
          <button
            type="submit"
            aria-label="Sign out"
            className="p-1.5 text-slate-500 dark:text-slate-400"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
