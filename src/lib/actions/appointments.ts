"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";

export interface AppointmentActionState {
  error?: string;
  success?: boolean;
}

export async function createAppointment(
  _prevState: AppointmentActionState | undefined,
  formData: FormData,
): Promise<AppointmentActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const prospectId = String(formData.get("prospect_id") ?? "");
  // The browser converts the rep's local date + time to an ISO instant, so the
  // server (UTC) never has to guess their time zone.
  const startsAtRaw = String(formData.get("starts_at") ?? "");
  const duration = Number(formData.get("duration_minutes") ?? 30);
  const notes = String(formData.get("notes") ?? "").trim();

  const startsAt = new Date(startsAtRaw);
  if (!prospectId) return { error: "Pick a prospect." };
  if (Number.isNaN(startsAt.getTime())) return { error: "Pick a date and time." };
  if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
    return { error: "Pick a valid duration." };
  }

  const { error } = await supabase.from("appointments").insert({
    prospect_id: prospectId,
    rep_id: user.id,
    starts_at: startsAt.toISOString(),
    duration_minutes: duration,
    notes: notes || null,
  });

  if (error) return { error: "Couldn't book that appointment. Try again." };

  revalidatePath("/calendar");
  return { success: true };
}

export async function deleteAppointment(appointmentId: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", appointmentId);
  if (error) throw new Error(error.message);
  revalidatePath("/calendar");
}
