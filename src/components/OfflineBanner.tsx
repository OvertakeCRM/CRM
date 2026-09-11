"use client";

import { useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { useOfflineStatus } from "@/lib/useOfflineStatus";
import { initOfflineSync } from "@/lib/offlineSync";

export default function OfflineBanner() {
  const { online, pendingCount, syncing, justSynced } = useOfflineStatus();

  useEffect(() => {
    initOfflineSync();
  }, []);

  if (!online) {
    return (
      <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
        <WifiOff size={15} />
        You&apos;re offline
        {pendingCount > 0
          ? ` — ${pendingCount} change${pendingCount === 1 ? "" : "s"} will sync automatically`
          : " — updates will be saved on this device until you're back online"}
      </div>
    );
  }

  if (syncing) {
    return (
      <div className="flex items-center justify-center gap-2 bg-blue-600 px-4 py-2 text-sm font-medium text-white">
        <RefreshCw size={15} className="animate-spin" />
        Syncing {pendingCount} change{pendingCount === 1 ? "" : "s"}…
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
        <WifiOff size={15} />
        {pendingCount} change{pendingCount === 1 ? "" : "s"} waiting to sync
      </div>
    );
  }

  if (justSynced) {
    return (
      <div className="flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2 text-sm font-medium text-white">
        <CheckCircle2 size={15} />
        All changes synced
      </div>
    );
  }

  return null;
}
