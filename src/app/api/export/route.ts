import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { STAGE_META } from "@/lib/stages";
import type { Prospect } from "@/lib/database.types";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = await createClient();
  let query = supabase
    .from("prospects")
    .select("*, assigned_rep:profiles!prospects_assigned_rep_id_fkey(full_name)")
    .order("updated_at", { ascending: false });

  if (user.role !== "admin") query = query.eq("assigned_rep_id", user.id);

  const { data, error } = await query;
  if (error) return new NextResponse("Failed to export", { status: 500 });

  type Row = Prospect & { assigned_rep: { full_name: string } | null };
  const rows = ((data ?? []) as unknown as Row[]).map((p) => ({
    warehouse_name: p.warehouse_name,
    address: p.address,
    stage: STAGE_META[p.stage].label,
    containers_per_week: p.containers_per_week ?? "",
    price_per_container: p.price_per_container ?? "",
    weekly_revenue_potential:
      p.containers_per_week != null && p.price_per_container != null
        ? (p.containers_per_week * p.price_per_container).toFixed(2)
        : "",
    assigned_rep: p.assigned_rep?.full_name ?? "",
    decision_maker_name: p.dm_name ?? "",
    decision_maker_phone: p.dm_phone ?? "",
    decision_maker_email: p.dm_email ?? "",
    competitor: p.competitor ?? "",
    loss_reason: p.loss_reason ?? "",
    next_follow_up_date: p.next_follow_up_date ?? "",
    created_at: p.created_at,
    updated_at: p.updated_at,
  }));

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="overtake-prospects-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
