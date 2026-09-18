"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import {
  createProspect,
  findSimilarProspects,
  type ActionState,
  type SimilarProspect,
} from "@/lib/actions/prospects";
import { STAGE_META } from "@/lib/stages";

const initialState: ActionState = {};
const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";
const labelClass = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function ProspectForm({
  reps,
  isAdmin,
  currentUserId,
}: {
  reps: { id: string; full_name: string }[];
  isAdmin: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createProspect, initialState);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [similar, setSimilar] = useState<SimilarProspect[] | null>(null);
  const [checking, startChecking] = useTransition();

  useEffect(() => {
    if (state?.error === "DUPLICATE_CHECK") {
      startChecking(async () => {
        const results = await findSimilarProspects(name, address);
        setSimilar(results);
      });
    }
  }, [state, name, address]);

  function createAnyway() {
    setConfirmDuplicate(true);
    setSimilar(null);
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  return (
    <>
      <form ref={formRef} action={formAction} className="space-y-5">
        <input type="hidden" name="lat" value={lat ?? ""} />
        <input type="hidden" name="lng" value={lng ?? ""} />
        <input type="hidden" name="confirm_duplicate" value={confirmDuplicate ? "true" : "false"} />

        <div>
          <label className={labelClass}>Warehouse name *</label>
          <input
            name="warehouse_name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setConfirmDuplicate(false);
            }}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Address *</label>
          <AddressAutocomplete
            onSelect={(r) => {
              setAddress(r.address);
              setLat(r.lat);
              setLng(r.lng);
              setConfirmDuplicate(false);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Containers per week</label>
            <input name="containers_per_week" type="number" min={0} inputMode="numeric" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Price per container</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
                $
              </span>
              <input
                name="price_per_container"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className={`${inputClass} pl-7`}
              />
            </div>
          </div>
        </div>

        {isAdmin && (
          <div>
            <label className={labelClass}>Assigned rep</label>
            <select name="assigned_rep_id" defaultValue={currentUserId} className={`${inputClass} bg-white dark:bg-slate-800`}>
              {reps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <legend className="px-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Decision maker (optional)</legend>
          <input name="dm_name" placeholder="Name" className={`${inputClass} py-2.5`} />
          <input name="dm_phone_cell" type="tel" placeholder="Cell phone" className={`${inputClass} py-2.5`} />
          <input name="dm_phone_work" type="tel" placeholder="Work phone" className={`${inputClass} py-2.5`} />
          <input name="dm_email" type="email" placeholder="Email" className={`${inputClass} py-2.5`} />
          <input name="competitor" placeholder="Current competitor (if known)" className={`${inputClass} py-2.5`} />
        </fieldset>

        {state?.error && state.error !== "DUPLICATE_CHECK" && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
            {state.error}
          </p>
        )}

        <div className="flex gap-2 pb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save prospect"}
          </button>
        </div>
      </form>

      {(checking || similar) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 dark:bg-slate-900 md:rounded-2xl">
            <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">This might already exist</h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              We found similar prospects already in the system. Check before adding a duplicate.
            </p>

            {checking && <p className="py-4 text-center text-sm text-slate-400 dark:text-slate-500">Checking…</p>}

            {similar && (
              <div className="space-y-2">
                {similar.map((s) => (
                  <div key={s.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="font-semibold text-slate-900 dark:text-white">{s.warehouse_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{s.address}</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{STAGE_META[s.stage].label}</p>
                  </div>
                ))}
              </div>
            )}

            {similar && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSimilar(null)}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Go back
                </button>
                <button
                  type="button"
                  onClick={createAnyway}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Create anyway
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
