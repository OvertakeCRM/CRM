import { Mail } from "lucide-react";
import { EMAIL_TEMPLATES, buildMailtoUrl } from "@/lib/emailTemplates";
import type { Stage } from "@/lib/database.types";

export default function EmailTemplates({
  email,
  contactName,
  warehouseName,
  repName,
  currentStage,
}: {
  email: string | null;
  contactName: string | null;
  warehouseName: string;
  repName: string;
  currentStage: Stage;
}) {
  const entries = Object.entries(EMAIL_TEMPLATES) as [Stage, (typeof EMAIL_TEMPLATES)[Stage]][];
  if (entries.length === 0) return null;

  if (!email) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500">Add a decision-maker email to use email templates.</p>
    );
  }

  const vars = { email, contactName: contactName || "there", warehouseName, repName };

  return (
    <div className="space-y-1.5">
      {entries.map(([stage, template]) => {
        if (!template) return null;
        return (
          <a
            key={stage}
            href={buildMailtoUrl(template, vars)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium ${
              stage === currentStage
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            <Mail size={16} className="shrink-0" />
            {template.label}
            {stage === currentStage && <span className="ml-auto text-xs font-normal">Current stage</span>}
          </a>
        );
      })}
    </div>
  );
}
