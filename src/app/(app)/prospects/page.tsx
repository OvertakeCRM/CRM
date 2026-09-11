import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import ProspectCard from "@/components/ProspectCard";
import { STAGES, STAGE_META } from "@/lib/stages";
import type { ProspectWithRep, Stage } from "@/lib/database.types";

export const metadata = { title: "Prospects — Royal Westmont CRM" };

type SortKey = "updated_desc" | "created_desc" | "containers_desc" | "name_asc";

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const supabase = await createClient();

  const scope = params.scope === "all" || user.role === "admin" ? (params.scope ?? (user.role === "admin" ? "all" : "mine")) : "mine";
  const stageFilter = (params.stage as Stage | undefined) ?? "";
  const repFilter = params.rep ?? "";
  const q = params.q?.trim() ?? "";
  const sort = (params.sort as SortKey | undefined) ?? "updated_desc";

  let query = supabase
    .from("prospects")
    .select("*, assigned_rep:profiles!prospects_assigned_rep_id_fkey(id, full_name)");

  if (scope === "mine") {
    query = query.eq("assigned_rep_id", user.id);
  } else if (repFilter) {
    query = query.eq("assigned_rep_id", repFilter);
  }

  if (stageFilter) query = query.eq("stage", stageFilter);
  if (q) query = query.or(`warehouse_name.ilike.%${q}%,address.ilike.%${q}%`);

  const sortMap: Record<SortKey, { column: string; ascending: boolean }> = {
    updated_desc: { column: "updated_at", ascending: false },
    created_desc: { column: "created_at", ascending: false },
    containers_desc: { column: "containers_per_week", ascending: false },
    name_asc: { column: "warehouse_name", ascending: true },
  };
  const { column, ascending } = sortMap[sort] ?? sortMap.updated_desc;
  query = query.order(column, { ascending, nullsFirst: false });

  const [{ data: prospects }, { data: reps }] = await Promise.all([
    query,
    user.role === "admin" ? supabase.from("profiles").select("id, full_name").order("full_name") : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ]);

  const list = (prospects ?? []) as unknown as ProspectWithRep[];

  return (
    <div className="px-4 pt-4 md:px-0">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Prospects</h1>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-400 sm:inline">{list.length} shown</span>
          <a href="/api/export" className="text-sm font-medium text-blue-600 hover:underline">
            Export CSV
          </a>
        </div>
      </div>

      <form method="get" className="mb-4 space-y-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or address…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <div className="flex flex-wrap gap-2">
          {user.role === "admin" && (
            <select name="scope" defaultValue={scope} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm">
              <option value="all">All reps</option>
              <option value="mine">My prospects</option>
            </select>
          )}
          {user.role === "rep" && (
            <select name="scope" defaultValue={scope} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm">
              <option value="mine">My prospects</option>
              <option value="all">Everyone&apos;s (read-only)</option>
            </select>
          )}

          <select name="stage" defaultValue={stageFilter} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm">
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_META[s].label}
              </option>
            ))}
          </select>

          {scope === "all" && user.role === "admin" && (
            <select name="rep" defaultValue={repFilter} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm">
              <option value="">All reps</option>
              {(reps ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name}
                </option>
              ))}
            </select>
          )}

          <select name="sort" defaultValue={sort} className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm">
            <option value="updated_desc">Recently updated</option>
            <option value="created_desc">Newest</option>
            <option value="containers_desc">Containers/week</option>
            <option value="name_asc">Name A–Z</option>
          </select>

          <button type="submit" className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white">
            Apply
          </button>
        </div>
      </form>

      <div className="space-y-2 pb-4">
        {list.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">No prospects match these filters.</p>
        )}
        {list.map((p) => (
          <ProspectCard key={p.id} prospect={p} showRep={scope === "all"} />
        ))}
      </div>
    </div>
  );
}
