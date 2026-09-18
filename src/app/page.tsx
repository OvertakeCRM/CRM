import { redirect } from "next/navigation";
import Link from "next/link";
import { KanbanSquare, Navigation2, WifiOff, LayoutDashboard, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata = { title: "Overtake CRM — Warehouse Prospect Tracker" };

const FEATURES = [
  {
    icon: KanbanSquare,
    title: "9-stage pipeline",
    description: "Track every deal from cold lead to signed contract, with a full audit-logged activity timeline.",
  },
  {
    icon: Navigation2,
    title: "Built for the field",
    description: "GPS check-in and nearest-neighbor route planning that hands straight off to Google Maps.",
  },
  {
    icon: WifiOff,
    title: "Works offline",
    description: "Stage changes, notes, and quick-logs queue locally and sync the moment signal returns.",
  },
  {
    icon: LayoutDashboard,
    title: "Manager visibility",
    description: "Stage counts, stale leads, rep leaderboard, and container-volume forecasting in one view.",
  },
];

const STATS = [
  { value: "9", label: "Pipeline stages" },
  { value: "100%", label: "Offline-capable" },
  { value: "1-tap", label: "GPS check-in" },
  { value: "Live", label: "Manager dashboard" },
];

function CheckeredStripe({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-2 w-full ${className}`}
      style={{
        backgroundImage:
          "repeating-conic-gradient(#e10600 0deg 90deg, #000 90deg 180deg)",
        backgroundSize: "16px 16px",
      }}
    />
  );
}

export default async function RootPage() {
  const user = await getCurrentUser();
  if (user) redirect("/prospects");

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-black text-sm font-extrabold text-white">
            OT
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Overtake</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero — always dark, brand-forward regardless of light/dark toggle */}
      <section className="relative overflow-hidden bg-black">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[64rem] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #e10600 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 40px)",
          }}
        />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pb-24 pt-8 text-center sm:px-6">
          <span className="rounded-full border border-red-600/40 bg-red-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-400">
            Built for warehouse sales teams
          </span>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
            Overtake
            <span className="block bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
              your pipeline.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-slate-400">
            The warehouse prospect tracker built to replace a spreadsheet, not compete with Salesforce.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-blue-700 hover:shadow-red-600/30"
            >
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-lg border border-white/15 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
            >
              See what it does
            </a>
          </div>
        </div>

        <CheckeredStripe />
      </section>

      {/* Stats strip */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{stat.value}</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Everything your reps need, nothing they don&apos;t
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            A CRM shaped around a day in the field — from the first knock to the signed contract.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-red-600/30 hover:shadow-lg hover:shadow-red-600/5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600/10 text-blue-600 transition-colors group-hover:bg-red-600 group-hover:text-white dark:text-blue-400">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA band */}
      <section className="relative overflow-hidden bg-black">
        <CheckeredStripe />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to overtake your pipeline?</h2>
          <p className="mt-3 text-slate-400">Sign in to pick up right where your team left off.</p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-blue-700"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-600">
        © {new Date().getFullYear()} Overtake
      </footer>
    </main>
  );
}
