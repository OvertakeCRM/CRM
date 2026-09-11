import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import StageBadge from "@/components/StageBadge";
import StageChanger from "@/components/StageChanger";
import QuickLogButtons from "@/components/QuickLogButtons";
import NoteInput from "@/components/NoteInput";
import ActivityTimeline from "@/components/ActivityTimeline";
import PhotoUploader from "@/components/PhotoUploader";
import ContactLinks from "@/components/ContactLinks";
import ProspectAdminControls from "@/components/ProspectAdminControls";
import EditToggle from "@/components/EditToggle";
import GpsCheckIn from "@/components/GpsCheckIn";
import { LOSS_REASON_META } from "@/lib/stages";
import type { ActivityLogEntry, Photo, Prospect } from "@/lib/database.types";

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: prospect }, { data: activity }, { data: photos }] = await Promise.all([
    supabase
      .from("prospects")
      .select("*, assigned_rep:profiles!prospects_assigned_rep_id_fkey(id, full_name)")
      .eq("id", id)
      .single(),
    supabase
      .from("activity_log")
      .select("*, rep:profiles!activity_log_rep_id_fkey(id, full_name)")
      .eq("prospect_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("photos").select("*").eq("prospect_id", id).order("created_at", { ascending: false }),
  ]);

  if (!prospect) notFound();

  const p = prospect as unknown as Prospect & { assigned_rep: { id: string; full_name: string } | null };
  const canEdit = user.role === "admin" || p.assigned_rep_id === user.id;

  let reps: { id: string; full_name: string }[] = [];
  if (user.role === "admin") {
    const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
    reps = data ?? [];
  }

  return (
    <div className="px-4 pb-8 pt-4 md:px-0">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{p.warehouse_name}</h1>
            <p className="text-sm text-slate-500">{p.address}</p>
          </div>
          <StageBadge stage={p.stage} className="shrink-0" />
        </div>

        {p.stage === "lost" && p.loss_reason && (
          <p className="mt-2 text-sm text-rose-600">Lost — {LOSS_REASON_META[p.loss_reason]}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
          {p.containers_per_week != null && <span>{p.containers_per_week} containers/wk</span>}
          {p.assigned_rep && <span>Rep: {p.assigned_rep.full_name}</span>}
          {p.next_follow_up_date && <span>Follow up: {p.next_follow_up_date}</span>}
          <span>Updated {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}</span>
        </div>
      </div>

      {user.role === "admin" && (
        <div className="mb-4">
          <ProspectAdminControls prospectId={p.id} assignedRepId={p.assigned_rep_id} reps={reps} />
        </div>
      )}

      <div className="mb-5">
        <ContactLinks phone={p.dm_phone} email={p.dm_email} address={p.address} />
      </div>

      {(p.dm_name || p.competitor) && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          {p.dm_name && (
            <p>
              <span className="font-semibold text-slate-700">Decision maker:</span> {p.dm_name}
            </p>
          )}
          {p.competitor && (
            <p className="mt-1">
              <span className="font-semibold text-slate-700">Current competitor:</span> {p.competitor}
            </p>
          )}
        </div>
      )}

      {canEdit && p.lat != null && p.lng != null && p.stage !== "sold_won" && p.stage !== "lost" && (
        <div className="mb-5">
          <GpsCheckIn prospectId={p.id} lat={p.lat} lng={p.lng} stage={p.stage} />
        </div>
      )}

      {canEdit && (
        <div className="mb-5">
          <StageChanger prospectId={p.id} currentStage={p.stage} />
        </div>
      )}

      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Photos</h2>
        <PhotoUploader prospectId={p.id} photos={(photos ?? []) as Photo[]} />
      </div>

      {canEdit && (
        <>
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-500">Quick log</h2>
            <QuickLogButtons prospectId={p.id} />
          </div>

          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-500">Add a note</h2>
            <NoteInput prospectId={p.id} />
          </div>
        </>
      )}

      <div className="mb-6">
        <EditToggle prospect={p} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">Activity</h2>
        <ActivityTimeline entries={(activity ?? []) as unknown as ActivityLogEntry[]} />
      </div>
    </div>
  );
}
