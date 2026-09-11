import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import RoutePlanner from "@/components/RoutePlanner";
import type { ProspectWithRep } from "@/lib/database.types";

export const metadata = { title: "Route — Royal Westmont CRM" };

export default async function RoutePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("prospects")
    .select("*, assigned_rep:profiles!prospects_assigned_rep_id_fkey(id, full_name)")
    .eq("assigned_rep_id", user.id)
    .not("lat", "is", null)
    .not("stage", "in", "(sold_won,lost)")
    .order("warehouse_name");

  return (
    <div className="px-4 pb-8 pt-4 md:px-0">
      <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Plan today&apos;s route</h1>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Pick your stops — we&apos;ll suggest an efficient order from wherever you are, then hand off to Google Maps
        for turn-by-turn directions.
      </p>
      <RoutePlanner prospects={(data ?? []) as unknown as ProspectWithRep[]} />
    </div>
  );
}
