"use client";

import { useTransition } from "react";
import { logActivityClient } from "@/lib/offlineActions";

const QUICK_LOGS = [
  "No answer",
  "Gatekeeper only",
  "Call back later",
  "Left voicemail",
  "Rescheduled",
  "Site closed",
  "Wrong number",
  "Not interested",
];

export default function QuickLogButtons({
  prospectId,
  onLogged,
}: {
  prospectId: string;
  onLogged?: (note: string, queued: boolean, id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function log(text: string) {
    startTransition(async () => {
      const { queued, id } = await logActivityClient(prospectId, "quick_log", text);
      onLogged?.(text, queued, id);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_LOGS.map((label) => (
        <button
          key={label}
          type="button"
          disabled={isPending}
          onClick={() => log(label)}
          className="rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 active:bg-slate-100 disabled:opacity-60"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
