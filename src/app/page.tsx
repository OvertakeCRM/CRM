import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "Overtake CRM — Warehouse Prospect Tracker" };

const FEATURES = [
  {
    title: "9-stage pipeline",
    description: "Track every warehouse deal from cold lead to signed contract, with a full audit-logged activity timeline.",
  },
  {
    title: "Built for the field",
    description: "GPS check-in, nearest-neighbor route planning, and offline support for reps working without signal.",
  },
  {
    title: "Manager visibility",
    description: "Stage counts, stale leads, rep leaderboard, and container-volume forecasting in one dashboard.",
  },
];

export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) redirect("/prospects");

  return (
    <main className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
      <ThemeToggle className="absolute right-4 top-4" />

      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-20 pt-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Overtake
        </h1>
        <p className="mt-3 text-lg text-slate-500 dark:text-slate-400">
          The warehouse prospect tracker built to replace a spreadsheet, not compete with Salesforce.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Sign in
        </Link>

        <div className="mt-20 grid w-full gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-800 dark:text-slate-600">
        © {new Date().getFullYear()} Overtake
      </footer>
    </main>
  );
}
