"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reassignProspect, deleteProspect } from "@/lib/actions/prospects";

export default function ProspectAdminControls({
  prospectId,
  assignedRepId,
  reps,
}: {
  prospectId: string;
  assignedRepId: string;
  reps: { id: string; full_name: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Assigned to</label>
      <select
        defaultValue={assignedRepId}
        disabled={isPending}
        onChange={(e) => startTransition(() => reassignProspect(prospectId, e.target.value))}
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        {reps.map((rep) => (
          <option key={rep.id} value={rep.id}>
            {rep.full_name}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm("Delete this prospect? This can't be undone.")) {
            startTransition(async () => {
              await deleteProspect(prospectId);
              router.push("/prospects");
            });
          }
        }}
        className="ml-auto text-sm font-medium text-rose-600 dark:text-rose-400"
      >
        Delete
      </button>
    </div>
  );
}
