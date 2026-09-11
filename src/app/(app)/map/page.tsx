import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import MapView from "@/components/MapView";
import type { ProspectWithRep } from "@/lib/database.types";

export const metadata = { title: "Map — Royal Westmont CRM" };

export default async function MapPage() {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("prospects")
    .select("*, assigned_rep:profiles!prospects_assigned_rep_id_fkey(id, full_name)")
    .neq("stage", "lost");

  if (user.role !== "admin") {
    query = query.eq("assigned_rep_id", user.id);
  }

  const { data } = await query;

  return (
    <div className="pt-4">
      <h1 className="mb-4 px-4 text-xl font-bold text-slate-900 md:px-0">Territory map</h1>
      <MapView prospects={(data ?? []) as unknown as ProspectWithRep[]} />
    </div>
  );
}
