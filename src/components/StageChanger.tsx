"use client";

import { useState, useTransition } from "react";
import { STAGES, STAGE_META, LOSS_REASON_META } from "@/lib/stages";
import { changeStage } from "@/lib/actions/prospects";
import type { LossReason, Stage } from "@/lib/database.types";

export default function StageChanger({ prospectId, currentStage }: { prospectId: string; currentStage: Stage }) {
  const [open, setOpen] = useState(false);
  const [pendingStage, setPendingStage] = useState<Stage | null>(null);
  const [note, setNote] = useState("");
  const [lossReason, setLossReason] = useState<LossReason>("price");
  const [isPending, startTransition] = useTransition();

  function pickStage(stage: Stage) {
    if (stage === currentStage) return;
    setPendingStage(stage);
    setNote("");
  }

  function confirm() {
    if (!pendingStage) return;
    startTransition(async () => {
      await changeStage(prospectId, pendingStage, note.trim() || undefined, pendingStage === "lost" ? lossReason : undefined);
      setPendingStage(null);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-bold text-white shadow-sm active:bg-blue-700"
      >
        Change stage — currently {STAGE_META[currentStage].label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={() => !pendingStage && setOpen(false)}>
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {!pendingStage ? (
              <>
                <h2 className="mb-3 text-lg font-bold text-slate-900">Update stage</h2>
                <div className="grid grid-cols-1 gap-2">
                  {STAGES.map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => pickStage(stage)}
                      disabled={stage === currentStage}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-base font-semibold transition disabled:opacity-40 ${STAGE_META[stage].color}`}
                    >
                      <span className={`size-2.5 rounded-full ${STAGE_META[stage].dot}`} />
                      {STAGE_META[stage].label}
                      {stage === currentStage && <span className="ml-auto text-xs font-normal">Current</span>}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-3 w-full rounded-xl px-4 py-3 text-center text-sm font-medium text-slate-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h2 className="mb-3 text-lg font-bold text-slate-900">
                  Move to {STAGE_META[pendingStage].label}?
                </h2>

                {pendingStage === "lost" && (
                  <div className="mb-4">
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Loss reason</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(LOSS_REASON_META) as [LossReason, string][]).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setLossReason(value)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium ${
                            lossReason === value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-300 text-slate-600"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="mb-1.5 block text-sm font-medium text-slate-700">Note (optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="What happened?"
                  className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingStage(null)}
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={isPending}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isPending ? "Saving…" : "Confirm"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
