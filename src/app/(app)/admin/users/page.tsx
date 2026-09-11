import { requireAdmin } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import InviteRepForm from "@/components/InviteRepForm";
import RoleToggle from "@/components/RoleToggle";
import type { Profile } from "@/lib/database.types";

export const metadata = { title: "Users — Royal Westmont CRM" };

export default async function UsersPage() {
  const user = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("full_name");
  const profiles = (data ?? []) as Profile[];

  return (
    <div className="px-4 pb-10 pt-4 md:px-0">
      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Users</h1>

      <div className="mb-6">
        <InviteRepForm />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{p.full_name}</td>
                <td className="px-4 py-2.5">
                  <RoleToggle userId={p.id} role={p.role} disabled={p.id === user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Invited reps get an email to set their password.</p>
    </div>
  );
}
