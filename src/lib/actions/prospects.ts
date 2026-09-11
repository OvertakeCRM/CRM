"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/dal";
import type { LossReason, Stage } from "@/lib/database.types";

export interface ActionState {
  error?: string;
  success?: string;
}

export interface SimilarProspect {
  id: string;
  warehouse_name: string;
  address: string;
  stage: Stage;
  assigned_rep_id: string;
  score: number;
}

export async function findSimilarProspects(
  warehouseName: string,
  address: string,
): Promise<SimilarProspect[]> {
  if (!warehouseName.trim() && !address.trim()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_similar_prospects", {
    p_warehouse_name: warehouseName,
    p_address: address,
  });
  if (error || !data) return [];
  return data as SimilarProspect[];
}

export async function createProspect(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const supabase = await createClient();

  const warehouse_name = String(formData.get("warehouse_name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!warehouse_name || !address) {
    return { error: "Warehouse name and address are required." };
  }

  const lat = formData.get("lat") ? Number(formData.get("lat")) : null;
  const lng = formData.get("lng") ? Number(formData.get("lng")) : null;
  const containers = formData.get("containers_per_week");
  const assignedRepRaw = String(formData.get("assigned_rep_id") ?? "");
  const assigned_rep_id = user.role === "admin" && assignedRepRaw ? assignedRepRaw : user.id;
  const confirmDuplicate = formData.get("confirm_duplicate") === "true";

  if (!confirmDuplicate) {
    const similar = await findSimilarProspects(warehouse_name, address);
    if (similar.length > 0) {
      return { error: "DUPLICATE_CHECK" };
    }
  }

  const { data, error } = await supabase
    .from("prospects")
    .insert({
      warehouse_name,
      address,
      lat,
      lng,
      containers_per_week: containers ? Number(containers) : null,
      dm_name: String(formData.get("dm_name") ?? "") || null,
      dm_phone: String(formData.get("dm_phone") ?? "") || null,
      dm_email: String(formData.get("dm_email") ?? "") || null,
      competitor: String(formData.get("competitor") ?? "") || null,
      assigned_rep_id,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Couldn't save that prospect. Try again." };
  }

  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/map");
  redirect(`/prospects/${data.id}`);
}

export async function updateProspectDetails(
  prospectId: string,
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();

  const warehouse_name = String(formData.get("warehouse_name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!warehouse_name || !address) {
    return { error: "Warehouse name and address are required." };
  }

  const containers = formData.get("containers_per_week");
  const followUp = String(formData.get("next_follow_up_date") ?? "");

  const { error } = await supabase
    .from("prospects")
    .update({
      warehouse_name,
      address,
      lat: formData.get("lat") ? Number(formData.get("lat")) : null,
      lng: formData.get("lng") ? Number(formData.get("lng")) : null,
      containers_per_week: containers ? Number(containers) : null,
      dm_name: String(formData.get("dm_name") ?? "") || null,
      dm_phone: String(formData.get("dm_phone") ?? "") || null,
      dm_email: String(formData.get("dm_email") ?? "") || null,
      competitor: String(formData.get("competitor") ?? "") || null,
      next_follow_up_date: followUp || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospectId);

  if (error) return { error: "Couldn't save changes." };

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/map");
  return { success: "Saved." };
}

export async function changeStage(
  prospectId: string,
  newStage: Stage,
  note?: string,
  lossReason?: LossReason,
) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("change_prospect_stage", {
    p_prospect_id: prospectId,
    p_new_stage: newStage,
    p_note: note || null,
    p_loss_reason: lossReason || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/map");
  revalidatePath("/dashboard");
}

export async function logActivity(prospectId: string, type: "note" | "quick_log", note: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.rpc("log_prospect_activity", {
    p_prospect_id: prospectId,
    p_type: type,
    p_note: note,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
}

export async function reassignProspect(prospectId: string, newRepId: string) {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Only admins can reassign prospects.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("prospects")
    .update({ assigned_rep_id: newRepId, updated_at: new Date().toISOString() })
    .eq("id", prospectId);

  if (error) throw new Error(error.message);

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
  revalidatePath("/pipeline");
}

export async function deleteProspect(prospectId: string) {
  const user = await requireUser();
  if (user.role !== "admin") throw new Error("Only admins can delete prospects.");

  const supabase = await createClient();
  const { error } = await supabase.from("prospects").delete().eq("id", prospectId);
  if (error) throw new Error(error.message);

  revalidatePath("/prospects");
  revalidatePath("/pipeline");
  revalidatePath("/map");
}

export async function uploadPhoto(prospectId: string, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file selected.");

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${prospectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("prospect-photos")
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("photos").insert({
    prospect_id: prospectId,
    uploaded_by: user.id,
    storage_path: path,
  });

  if (insertError) throw new Error(insertError.message);

  revalidatePath(`/prospects/${prospectId}`);
}

export async function deletePhoto(photoId: string, prospectId: string, storagePath: string) {
  await requireUser();
  const supabase = await createClient();

  await supabase.storage.from("prospect-photos").remove([storagePath]);
  const { error } = await supabase.from("photos").delete().eq("id", photoId);
  if (error) throw new Error(error.message);

  revalidatePath(`/prospects/${prospectId}`);
}
