"use client";

import { useActionState } from "react";
import { updatePassword, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {state?.error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
