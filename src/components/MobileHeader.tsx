import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export default function MobileHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <h1 className="text-base font-bold text-slate-900">{title}</h1>
      <form action={logout}>
        <button type="submit" aria-label="Sign out" className="p-1.5 text-slate-500">
          <LogOut size={18} />
        </button>
      </form>
    </header>
  );
}
