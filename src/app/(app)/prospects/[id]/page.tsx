import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import StageBadge from "@/components/StageBadge";
import PhotoUploader from "@/components/PhotoUploader";
import ContactLinks from "@/components/ContactLinks";
import EmailTemplates from "@/components/EmailTemplates";
import ProspectAdminControls from "@/components/ProspectAdminControls";
import EditToggle from "@/components/EditToggle";
import ProspectActivityWorkspace from "@/components/ProspectActivityWorkspace";
import { LOSS_REASON_META } from "@/lib/stages";
import { formatCurrency } from "@/lib/format";
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{p.warehouse_name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{p.address}</p>
          </div>
          <StageBadge stage={p.stage} className="shrink-0" />
        </div>

        {p.stage === "lost" && p.loss_reason && (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">Lost — {LOSS_REASON_META[p.loss_reason]}</p>
        )}

        {p.containers_per_week != null && p.price_per_container != null ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {p.containers_per_week} containers/wk &times; {formatCurrency(p.price_per_container)} ={" "}
            <span className="text-slate-700 dark:text-slate-300">
              {formatCurrency(p.containers_per_week * p.price_per_container)}/wk
            </span>
          </p>
        ) : (
          <>
            {p.containers_per_week != null && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{p.containers_per_week} containers/wk</p>
            )}
            {p.price_per_container != null && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {formatCurrency(p.price_per_container)}/container
              </p>
            )}
          </>
        )}

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
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
        <ContactLinks cellPhone={p.dm_phone_cell} workPhone={p.dm_phone_work} email={p.dm_email} address={p.address} />
      </div>

      {(p.dm_name || p.dm_phone_work || p.competitor) && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
          {p.dm_name && (
            <p className="text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Decision maker:</span> {p.dm_name}
            </p>
          )}
          {p.dm_phone_work && (
            <p className="mt-1 text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Work phone:</span> {p.dm_phone_work}
            </p>
          )}
          {p.competitor && (
            <p className="mt-1 text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-700 dark:text-slate-200">Current competitor:</span> {p.competitor}
            </p>
          )}
        </div>
      )}

      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Email templates</h2>
        <EmailTemplates
          email={p.dm_email}
          contactName={p.dm_name}
          warehouseName={p.warehouse_name}
          repName={user.full_name}
          currentStage={p.stage}
        />
      </div>

      <div className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Photos</h2>
        <PhotoUploader prospectId={p.id} photos={(photos ?? []) as Photo[]} />
      </div>

      <ProspectActivityWorkspace
        prospectId={p.id}
        initialStage={p.stage}
        initialActivity={(activity ?? []) as unknown as ActivityLogEntry[]}
        canEdit={canEdit}
        lat={p.lat}
        lng={p.lng}
        currentUserId={user.id}
        currentUserName={user.full_name}
      />

      <div className="mt-6">
        <EditToggle prospect={p} />
      </div>
    </div>
  );
}
