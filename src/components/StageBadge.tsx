import { STAGE_META } from "@/lib/stages";
import type { Stage } from "@/lib/database.types";

export default function StageBadge({ stage, className = "" }: { stage: Stage; className?: string }) {
  const meta = STAGE_META[stage];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.color} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
