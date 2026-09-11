import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in — Royal Westmont CRM" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Royal Westmont</h1>
          <p className="mt-1 text-sm text-slate-500">Warehouse prospect tracker</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/forgot-password" className="font-medium text-blue-600 hover:underline">
            Forgot your password?
          </Link>
        </p>
      </div>
    </main>
  );
}
