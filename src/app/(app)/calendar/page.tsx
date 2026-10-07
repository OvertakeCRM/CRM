import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import CalendarView from "@/components/CalendarView";
import type { AppointmentWithProspect } from "@/lib/database.types";

export const metadata = { title: "Calendar — Overtake CRM" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 90);

  let prospectQuery = supabase
    .from("prospects")
    .select("id, warehouse_name, dm_name")
    .neq("stage", "lost")
    .order("warehouse_name");
  if (user.role !== "admin") prospectQuery = prospectQuery.eq("assigned_rep_id", user.id);

  const [{ data: appointments }, { data: prospects }] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "*, prospect:prospects(id, warehouse_name, address, dm_name), rep:profiles!appointments_rep_id_fkey(id, full_name)",
      )
      .gte("starts_at", since.toISOString())
      .order("starts_at"),
    prospectQuery,
  ]);

  return (
    <div className="px-4 pb-8 pt-4 md:px-0">
      <CalendarView
        appointments={(appointments ?? []) as unknown as AppointmentWithProspect[]}
        prospects={(prospects ?? []) as { id: string; warehouse_name: string; dm_name: string | null }[]}
        showRep={user.role === "admin"}
        initialProspectId={params.book ?? null}
      />
    </div>
  );
}
