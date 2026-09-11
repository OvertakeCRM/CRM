"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import ProspectEditForm from "@/components/ProspectEditForm";
import type { Prospect } from "@/lib/database.types";

export default function EditToggle({ prospect }: { prospect: Prospect }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-blue-600"
      >
        <Pencil size={14} /> Edit details
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <ProspectEditForm prospect={prospect} onDone={() => setOpen(false)} />
    </div>
  );
}
