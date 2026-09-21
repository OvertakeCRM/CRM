import type { Stage } from "@/lib/database.types";

interface EmailTemplate {
  label: string;
  subject: string;
  body: string;
}

// {{contact_name}}, {{warehouse_name}}, and {{rep_name}} get substituted in.
// Only open, active stages get a template — nothing to pitch once a deal is
// closed won or lost.
export const EMAIL_TEMPLATES: Partial<Record<Stage, EmailTemplate>> = {
  not_visited: {
    label: "Book an appointment",
    subject: "Quick visit to {{warehouse_name}}?",
    body: `Hi {{contact_name}},

I work with warehouse operators in the area and would love to stop by {{warehouse_name}} for a quick 15-20 minute conversation about your current setup.

Would you have time this week or next?

Thanks,
{{rep_name}}`,
  },
  visited: {
    label: "Follow up after first meeting",
    subject: "Great meeting you at {{warehouse_name}}",
    body: `Hi {{contact_name}},

Thanks for taking the time to show me around {{warehouse_name}} — I enjoyed learning more about your operation.

I'll follow up shortly with some next steps, but let me know if any questions come up in the meantime.

Best,
{{rep_name}}`,
  },
  contacted: {
    label: "Following up",
    subject: "Following up — {{warehouse_name}}",
    body: `Hi {{contact_name}},

Just following up on our conversation about {{warehouse_name}}. Happy to answer any questions or set up a time to go over details further.

Best,
{{rep_name}}`,
  },
  decision_maker_engaged: {
    label: "Next steps",
    subject: "Next steps for {{warehouse_name}}",
    body: `Hi {{contact_name}},

Thanks for the conversation about {{warehouse_name}}. Wanted to check in on next steps and see what would be most useful from my side — more information, a formal proposal, or another call?

Best,
{{rep_name}}`,
  },
  interested_qualified: {
    label: "Send more information",
    subject: "More information for {{warehouse_name}}",
    body: `Hi {{contact_name}},

As promised, following up with more information for {{warehouse_name}}. Let me know what other details would help as you evaluate this.

Best,
{{rep_name}}`,
  },
  proposal_sent: {
    label: "Check in on proposal",
    subject: "Checking in — proposal for {{warehouse_name}}",
    body: `Hi {{contact_name}},

Wanted to check in on the proposal I sent over for {{warehouse_name}}. Happy to walk through it together or make adjustments if anything needs a closer look.

Best,
{{rep_name}}`,
  },
  negotiating: {
    label: "Follow up on terms",
    subject: "Following up — {{warehouse_name}}",
    body: `Hi {{contact_name}},

Following up on where things stand for {{warehouse_name}}. Let me know if there's anything I can do to help get this across the line.

Best,
{{rep_name}}`,
  },
};

function fillTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/{{(\w+)}}/g, (_, key) => vars[key] ?? "");
}

export function buildMailtoUrl(
  template: EmailTemplate,
  { email, contactName, warehouseName, repName }: { email: string; contactName: string; warehouseName: string; repName: string },
) {
  const vars = { contact_name: contactName, warehouse_name: warehouseName, rep_name: repName };
  const subject = fillTemplate(template.subject, vars);
  const body = fillTemplate(template.body, vars);
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
