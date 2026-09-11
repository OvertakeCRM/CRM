"use client";

import { createClient } from "@/lib/supabase/client";
import { enqueue, getQueue, getQueueCount, removeFromQueue } from "@/lib/offlineDb";
import { setOfflineState } from "@/lib/offlineStore";

const JUST_SYNCED_MS = 3000;

export async function refreshQueueCount(): Promise<void> {
  const count = await getQueueCount();
  setOfflineState({ pendingCount: count });
}

let inFlight: Promise<void> | null = null;
let rerunRequested = false;

// A single in-flight pass, shared by every caller — if another sync is
// requested while one is running, it's queued as a rerun rather than
// dropped (the queue may have grown in the meantime) or run concurrently
// (which would let two passes claim and double-submit the same item).
export function syncQueue(): Promise<void> {
  if (inFlight) {
    rerunRequested = true;
    return inFlight;
  }

  inFlight = runSyncPass().finally(async () => {
    inFlight = null;
    if (rerunRequested) {
      rerunRequested = false;
      await syncQueue();
    }
  });

  return inFlight;
}

async function runSyncPass(): Promise<void> {
  setOfflineState({ syncing: true });
  const supabase = createClient();
  let syncedAny = false;

  const items = await getQueue();
  for (const item of items) {
    // Claim the item before acting on it — if this pass somehow overlaps
    // with another, only one can dequeue a given item, so it's processed
    // at most once. Put it back if the write itself fails.
    await removeFromQueue(item.id);
    try {
      if (item.kind === "stage_change") {
        const { error } = await supabase.rpc("change_prospect_stage", {
          p_prospect_id: item.prospectId,
          p_new_stage: item.newStage,
          p_note: item.note,
          p_loss_reason: item.lossReason,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc("log_prospect_activity", {
          p_prospect_id: item.prospectId,
          p_type: item.kind,
          p_note: item.note,
        });
        if (error) throw error;
      }
      syncedAny = true;
    } catch {
      await enqueue(item);
    }
  }

  const remaining = await getQueueCount();
  setOfflineState({ syncing: false, pendingCount: remaining });

  if (syncedAny) {
    setOfflineState({ justSynced: true });
    setTimeout(() => setOfflineState({ justSynced: false }), JUST_SYNCED_MS);
  }
}

let initialized = false;

export function initOfflineSync(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  setOfflineState({ online: navigator.onLine });
  refreshQueueCount();

  window.addEventListener("online", () => {
    setOfflineState({ online: true });
    syncQueue();
  });
  window.addEventListener("offline", () => {
    setOfflineState({ online: false });
  });

  if (navigator.onLine) syncQueue();

  // Belt-and-suspenders: some browsers don't fire 'online' reliably on flaky signal.
  setInterval(() => {
    if (navigator.onLine) syncQueue();
  }, 30000);
}
