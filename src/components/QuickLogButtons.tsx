"use client";

import { useTransition } from "react";
import { logActivity } from "@/lib/actions/prospects";

const QUICK_LOGS = ["No answer", "Gatekeeper only", "Call back later"];

export default function QuickLogButtons({ prospectId }: { prospectId: string }) {
  const [isPending, startTransition] = useTransition();

  function log(text: string) {
    startTransition(() => {
      logActivity(prospectId, "quick_log", text);
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
