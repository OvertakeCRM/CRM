"use client";

import { useActionState, useState } from "react";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { updateProspectDetails, type ActionState } from "@/lib/actions/prospects";
import type { Prospect } from "@/lib/database.types";

const initialState: ActionState = {};

export default function ProspectEditForm({ prospect, onDone }: { prospect: Prospect; onDone: () => void }) {
  const boundAction = updateProspectDetails.bind(null, prospect.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [lat, setLat] = useState(prospect.lat);
  const [lng, setLng] = useState(prospect.lng);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Warehouse name *</label>
        <input
          name="warehouse_name"
          required
          defaultValue={prospect.warehouse_name}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Address *</label>
        <AddressAutocomplete
          defaultValue={prospect.address}
          onSelect={(r) => {
            setLat(r.lat);
            setLng(r.lng);
          }}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Containers per week</label>
        <input
          name="containers_per_week"
          type="number"
          min={0}
          defaultValue={prospect.containers_per_week ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Next follow-up date</label>
        <input
          name="next_follow_up_date"
          type="date"
          defaultValue={prospect.next_follow_up_date ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
        <legend className="px-1 text-sm font-semibold text-slate-500">Decision maker</legend>
        <input
          name="dm_name"
          placeholder="Name"
          defaultValue={prospect.dm_name ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          name="dm_phone"
          type="tel"
          placeholder="Phone"
          defaultValue={prospect.dm_phone ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          name="dm_email"
          type="email"
          placeholder="Email"
          defaultValue={prospect.dm_email ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          name="competitor"
          placeholder="Current competitor (if known)"
          defaultValue={prospect.competitor ?? ""}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </fieldset>

      {state?.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      {state?.success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600"
        >
          Close
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
