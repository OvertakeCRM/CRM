"use client";

import { useActionState } from "react";
import { inviteRep, type ActionState } from "@/lib/actions/users";

const initialState: ActionState = {};

export default function InviteRepForm() {
  const [state, formAction, pending] = useActionState(inviteRep, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex-1 min-w-[140px]">
        <label className="mb-1 block text-xs font-medium text-slate-500">Full name</label>
        <input
          name="full_name"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 min-w-[180px]">
        <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Role</label>
        <select
          name="role"
          defaultValue="rep"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="rep">Rep</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send invite"}
      </button>

      {state?.error && <p className="w-full text-sm text-rose-600">{state.error}</p>}
      {state?.success && <p className="w-full text-sm text-emerald-600">{state.success}</p>}
    </form>
  );
}
