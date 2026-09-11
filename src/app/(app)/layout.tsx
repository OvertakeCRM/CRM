import { requireUser } from "@/lib/dal";
import TopBar from "@/components/TopBar";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <OfflineBanner />
      <TopBar user={user} />
      <MobileHeader title="Royal Westmont" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-0 pb-20 md:px-6 md:pb-8">{children}</main>
      <BottomNav isAdmin={user.role === "admin"} />
    </div>
  );
}
