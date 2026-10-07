import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

// Dates render in the viewer's own time zone, which the server can't know —
// components that format dates should skip rendering until they're in the
// browser to avoid a hydration mismatch.
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
