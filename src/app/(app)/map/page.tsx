import Link from "next/link";
import { Navigation2 } from "lucide-react";
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
      <div className="mb-4 flex items-center justify-between px-4 md:px-0">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Territory map</h1>
        <Link
          href="/route"
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Navigation2 size={15} />
          Plan today&apos;s route
        </Link>
      </div>
      <MapView prospects={(data ?? []) as unknown as ProspectWithRep[]} />
    </div>
  );
}
