import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import KanbanBoard from "@/components/KanbanBoard";
import type { ProspectWithRep } from "@/lib/database.types";

export const metadata = { title: "Pipeline — Royal Westmont CRM" };

export default async function PipelinePage() {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("prospects")
    .select("*, assigned_rep:profiles!prospects_assigned_rep_id_fkey(id, full_name)")
    .order("updated_at", { ascending: false });

  if (user.role !== "admin") {
    query = query.eq("assigned_rep_id", user.id);
  }

  const { data } = await query;

  return (
    <div className="pt-4">
      <div className="mb-4 flex items-center justify-between px-4 md:px-0">
        <h1 className="text-xl font-bold text-slate-900">Pipeline</h1>
        <p className="text-sm text-slate-400">Drag a card to change its stage</p>
      </div>
      <KanbanBoard initialProspects={(data ?? []) as unknown as ProspectWithRep[]} />
    </div>
  );
}
