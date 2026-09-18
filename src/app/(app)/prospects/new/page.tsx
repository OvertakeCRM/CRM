import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import ProspectForm from "@/components/ProspectForm";

export const metadata = { title: "New prospect — Overtake CRM" };

export default async function NewProspectPage() {
  const user = await requireUser();
  const supabase = await createClient();

  let reps: { id: string; full_name: string }[] = [];
  if (user.role === "admin") {
    const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
    reps = data ?? [];
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-5 md:px-0">
      <h1 className="mb-5 text-xl font-bold text-slate-900 dark:text-white">New prospect</h1>
      <ProspectForm reps={reps} isAdmin={user.role === "admin"} currentUserId={user.id} />
    </div>
  );
}
