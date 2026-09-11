"use client";

import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot, getServerSnapshot } from "@/lib/offlineStore";

export function useOfflineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
