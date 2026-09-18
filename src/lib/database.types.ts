export type Role = "admin" | "rep";

export type Stage =
  | "not_visited"
  | "visited"
  | "contacted"
  | "decision_maker_engaged"
  | "interested_qualified"
  | "proposal_sent"
  | "negotiating"
  | "sold_won"
  | "lost";

export type LossReason = "price" | "competitor" | "no_need" | "bad_timing" | "other";

export type ActivityType = "stage_change" | "note" | "quick_log";

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at: string;
}

export interface Prospect {
  id: string;
  warehouse_name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  containers_per_week: number | null;
  price_per_container: number | null;
  dm_name: string | null;
  dm_phone_cell: string | null;
  dm_phone_work: string | null;
  dm_email: string | null;
  competitor: string | null;
  assigned_rep_id: string;
  stage: Stage;
  loss_reason: LossReason | null;
  next_follow_up_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProspectWithRep extends Prospect {
  assigned_rep: Pick<Profile, "id" | "full_name"> | null;
}

export interface ActivityLogEntry {
  id: string;
  prospect_id: string;
  rep_id: string;
  type: ActivityType;
  old_stage: Stage | null;
  new_stage: Stage | null;
  note: string | null;
  created_at: string;
  rep: Pick<Profile, "id" | "full_name"> | null;
}

export interface Photo {
  id: string;
  prospect_id: string;
  uploaded_by: string;
  storage_path: string;
  created_at: string;
}

export interface AppSettings {
  id: number;
  stale_days: number;
}

// Minimal hand-written Database type for @supabase/ssr's generics.
// Regenerate with `supabase gen types typescript` once the project is linked
// if you want full type-safety on every query.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
