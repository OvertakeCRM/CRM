"use client";

import { useEffect, useMemo, useState } from "react";
import StageChanger from "@/components/StageChanger";
import GpsCheckIn from "@/components/GpsCheckIn";
import QuickLogButtons from "@/components/QuickLogButtons";
import NoteInput from "@/components/NoteInput";
import ActivityTimeline, { type DisplayActivityEntry } from "@/components/ActivityTimeline";
import { getQueueForProspect } from "@/lib/offlineDb";
import { useOfflineStatus } from "@/lib/useOfflineStatus";
import type { ActivityLogEntry, Stage } from "@/lib/database.types";

interface Props {
  prospectId: string;
  initialStage: Stage;
  initialActivity: ActivityLogEntry[];
  canEdit: boolean;
  lat: number | null;
  lng: number | null;
  currentUserId: string;
  currentUserName: string;
}

export default function ProspectActivityWorkspace({
  prospectId,
  initialStage,
  initialActivity,
  canEdit,
  lat,
  lng,
  currentUserId,
  currentUserName,
}: Props) {
  const [stage, setStage] = useState(initialStage);
  const [localEntries, setLocalEntries] = useState<DisplayActivityEntry[]>([]);
  const { pendingCount, syncing } = useOfflineStatus();

  // Whenever the offline queue changes, check which of our own optimistic
  // entries are still sitting in it (still pending) vs. already synced.
  useEffect(() => {
    let cancelled = false;
    getQueueForProspect(prospectId).then((queued) => {
      if (cancelled) return;
      const stillQueuedIds = new Set(queued.map((q) => q.id));
      setLocalEntries((prev) =>
        prev.map((e) => (e.pending !== stillQueuedIds.has(e.id) ? { ...e, pending: stillQueuedIds.has(e.id) } : e)),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [prospectId, pendingCount, syncing]);

  function addStageChangeEntry(newStage: Stage, note: string | undefined, queued: boolean, id: string) {
    setLocalEntries((prev) => [
      {
        id,
        prospect_id: prospectId,
        rep_id: currentUserId,
        type: "stage_change",
        old_stage: stage,
        new_stage: newStage,
        note: note ?? null,
        created_at: new Date().toISOString(),
        rep: { id: currentUserId, full_name: currentUserName },
        pending: queued,
      },
      ...prev,
    ]);
    setStage(newStage);
  }

  function addNoteEntry(type: "note" | "quick_log", text: string, queued: boolean, id: string) {
    setLocalEntries((prev) => [
      {
        id,
        prospect_id: prospectId,
        rep_id: currentUserId,
        type,
        old_stage: null,
        new_stage: null,
        note: text,
        created_at: new Date().toISOString(),
        rep: { id: currentUserId, full_name: currentUserName },
        pending: queued,
      },
      ...prev,
    ]);
  }

  const allEntries = useMemo(() => [...localEntries, ...initialActivity], [localEntries, initialActivity]);

  return (
    <div>
      {canEdit && lat != null && lng != null && stage !== "sold_won" && stage !== "lost" && (
        <div className="mb-5">
          <GpsCheckIn prospectId={prospectId} lat={lat} lng={lng} stage={stage} onStageChange={addStageChangeEntry} />
        </div>
      )}

      {canEdit && (
        <div className="mb-5">
          <StageChanger prospectId={prospectId} currentStage={stage} onStageChange={addStageChangeEntry} />
        </div>
      )}

      {canEdit && (
        <>
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-500">Quick log</h2>
            <QuickLogButtons
              prospectId={prospectId}
              onLogged={(note, queued, id) => addNoteEntry("quick_log", note, queued, id)}
            />
          </div>

          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-500">Add a note</h2>
            <NoteInput prospectId={prospectId} onLogged={(note, queued, id) => addNoteEntry("note", note, queued, id)} />
          </div>
        </>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">Activity</h2>
        <ActivityTimeline entries={allEntries} />
      </div>
    </div>
  );
}
