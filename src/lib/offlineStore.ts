"use client";

export interface OfflineSnapshot {
  online: boolean;
  pendingCount: number;
  syncing: boolean;
  // True for a few seconds right after a sync pass clears the queue —
  // timed by the sync engine itself, not by the components that read it.
  justSynced: boolean;
}

type Listener = () => void;

let snapshot: OfflineSnapshot = {
  online: true,
  pendingCount: 0,
  syncing: false,
  justSynced: false,
};

let listeners: Listener[] = [];

export function getSnapshot(): OfflineSnapshot {
  return snapshot;
}

const SERVER_SNAPSHOT: OfflineSnapshot = { online: true, pendingCount: 0, syncing: false, justSynced: false };

export function getServerSnapshot(): OfflineSnapshot {
  return SERVER_SNAPSHOT;
}

export function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function setOfflineState(partial: Partial<OfflineSnapshot>): void {
  snapshot = { ...snapshot, ...partial };
  listeners.forEach((l) => l());
}
