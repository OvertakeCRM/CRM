"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/lib/actions/users";
import type { Role } from "@/lib/database.types";

export default function RoleToggle({ userId, role, disabled }: { userId: string; role: Role; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={role}
      disabled={disabled || isPending}
      onChange={(e) => startTransition(() => updateUserRole(userId, e.target.value as Role))}
      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
    >
      <option value="rep">Rep</option>
      <option value="admin">Admin</option>
    </select>
  );
}
