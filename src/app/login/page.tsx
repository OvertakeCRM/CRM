import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "Sign in — Overtake CRM" };

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <ThemeToggle className="absolute right-4 top-4" />
      <Link
        href="/"
        className="absolute left-4 top-4 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        ← Back to home
      </Link>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Overtake</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Warehouse prospect tracker</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link href="/forgot-password" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Forgot your password?
          </Link>
        </p>
      </div>
    </main>
  );
}
