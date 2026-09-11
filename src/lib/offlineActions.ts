"use client";

import { createClient } from "@/lib/supabase/client";
import { enqueue } from "@/lib/offlineDb";
import { refreshQueueCount } from "@/lib/offlineSync";
import type { LossReason, Stage } from "@/lib/database.types";

function withTimeout<T>(promise: PromiseLike<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export interface OfflineWriteResult {
  queued: boolean;
  id: string;
}

/**
 * Writes directly to Supabase from the browser (bypassing the Next.js server
 * action) so it can still succeed with zero signal to anything but Supabase,
 * and can be queued locally when even that fails. Both RPCs are the same
 * SECURITY INVOKER functions the server actions use, so RLS still applies.
 */
export async function changeStageClient(
  prospectId: string,
  newStage: Stage,
  note?: string,
  lossReason?: LossReason,
): Promise<OfflineWriteResult> {
  const supabase = createClient();
  const id = crypto.randomUUID();
  try {
    const { error } = await withTimeout(
      supabase.rpc("change_prospect_stage", {
        p_prospect_id: prospectId,
        p_new_stage: newStage,
        p_note: note || null,
        p_loss_reason: lossReason || null,
      }),
    );
    if (error) throw error;
    return { queued: false, id };
  } catch {
    await enqueue({
      kind: "stage_change",
      id,
      prospectId,
      newStage,
      note: note || null,
      lossReason: lossReason || null,
      createdAt: new Date().toISOString(),
    });
    await refreshQueueCount();
    return { queued: true, id };
  }
}

export async function logActivityClient(
  prospectId: string,
  type: "note" | "quick_log",
  note: string,
): Promise<OfflineWriteResult> {
  const supabase = createClient();
  const id = crypto.randomUUID();
  try {
    const { error } = await withTimeout(
      supabase.rpc("log_prospect_activity", {
        p_prospect_id: prospectId,
        p_type: type,
        p_note: note,
      }),
    );
    if (error) throw error;
    return { queued: false, id };
  } catch {
    await enqueue({
      kind: type,
      id,
      prospectId,
      note,
      createdAt: new Date().toISOString(),
    });
    await refreshQueueCount();
    return { queued: true, id };
  }
}
