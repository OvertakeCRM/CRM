"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ActionState {
  error?: string;
  success?: string;
}

export async function inviteRep(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "rep") === "admin" ? "admin" : "rep";

  if (!email || !fullName) {
    return { error: "Name and email are required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Couldn't send the invite." };
  }

  if (role === "admin") {
    await admin.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
  }

  revalidatePath("/admin/users");
  return { success: `Invite sent to ${email}.` };
}

export async function updateUserRole(userId: string, role: "admin" | "rep") {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}
