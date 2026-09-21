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
    subject: "Quick visit to {{warehouse_name}} — Royal Westmont Container Unloading",
    body: `Hi {{contact_name}},

My name is {{rep_name}} and I'm reaching out from Royal Westmont Container Unloading. We specialize in fast, safe, and precise container unloading, transloading, and pallet reworking for warehouses and distribution centers across the Lower Mainland and Calgary.

I'd love the opportunity to stop by {{warehouse_name}} for a brief 15-20 minute conversation to learn more about your current unloading process and see if there's a way we could help save time, reduce labor strain, or improve turnaround on your inbound containers. Our teams are fully trained, insured, and bonded, so you can count on consistent, reliable service from day one.

Would you have some time this week or next for a quick visit? I'm happy to work around your schedule.

Looking forward to connecting,
{{rep_name}}
Royal Westmont Container Unloading`,
  },
  visited: {
    label: "Follow up after first meeting",
    subject: "Great meeting you at {{warehouse_name}}",
    body: `Hi {{contact_name}},

Thank you for taking the time to show me around {{warehouse_name}} and walk me through your current operation — I really enjoyed the conversation and learning more about how your team handles inbound freight.

As I mentioned, Royal Westmont Container Unloading has built our reputation on reliability, efficiency, and precision, whether that's straight container unloading, transloading between containers or transport modes, pallet reworking, or a custom special project. Our goal is always the same: protect your goods, keep your operations on schedule, and give you one less thing to worry about.

I'll be following up shortly with some thoughts on how we could support {{warehouse_name}} specifically, but please don't hesitate to reach out in the meantime if any questions come to mind.

Thanks again for your time,
{{rep_name}}
Royal Westmont Container Unloading`,
  },
  contacted: {
    label: "Following up",
    subject: "Following up — {{warehouse_name}}",
    body: `Hi {{contact_name}},

Just wanted to follow up on our recent conversation about {{warehouse_name}}. At Royal Westmont Container Unloading, we work with businesses across the Lower Mainland and Calgary to take the pressure off container unloading, transloading, and pallet handling — backed by trained, insured, and bonded teams who treat every shipment like it's their own.

I'd love to keep the conversation going and see whether there's a good fit for {{warehouse_name}}. Happy to answer any questions, share more detail on how we work, or set up a time to talk further — whatever's most useful on your end.

Best,
{{rep_name}}
Royal Westmont Container Unloading`,
  },
  decision_maker_engaged: {
    label: "Next steps",
    subject: "Next steps for {{warehouse_name}}",
    body: `Hi {{contact_name}},

Thanks again for the conversation about {{warehouse_name}} — it's clear there could be a good opportunity for Royal Westmont Container Unloading to support your team.

To help move things forward, I wanted to check in on what would be most useful next: more detail on our container unloading, transloading, or pallet reworking services, a formal proposal tailored to your volume and schedule, or another call to talk through specifics with your team.

Whatever makes the most sense, I'm happy to put it together. Just let me know how you'd like to proceed.

Best,
{{rep_name}}
Royal Westmont Container Unloading`,
  },
  interested_qualified: {
    label: "Send more information",
    subject: "More information for {{warehouse_name}}",
    body: `Hi {{contact_name}},

As promised, following up with more information on how Royal Westmont Container Unloading could support {{warehouse_name}}.

A quick recap of what we handle:
- Container Unloading — fast, safe, and precise unloading of all container types, handled by trained, insured, and bonded teams
- Container Transloading — efficient transfer of goods between containers or transport modes to streamline your supply chain
- Pallet Reworking — expert re-palletizing, labeling, and prep to meet your specifications and optimize storage
- Special Projects — customized solutions for oversized, fragile, or high-value shipments

We're proud to be a trusted partner for businesses across the Lower Mainland and Calgary that demand precision, accountability, and reliable turnaround. Let me know what other details would be helpful as you evaluate this for {{warehouse_name}}.

Best,
{{rep_name}}
Royal Westmont Container Unloading`,
  },
  proposal_sent: {
    label: "Check in on proposal",
    subject: "Checking in — proposal for {{warehouse_name}}",
    body: `Hi {{contact_name}},

Wanted to check in on the proposal I sent over for {{warehouse_name}}. I know these decisions take time, so no pressure at all — just wanted to make sure it landed and see if anything needs a closer look.

If it would help, I'm happy to walk through the numbers together, adjust the scope, or answer any questions your team may have. Our priority at Royal Westmont Container Unloading is making sure the plan actually fits how {{warehouse_name}} operates day to day.

Let me know what would be most useful, and I'll get right on it.

Best,
{{rep_name}}
Royal Westmont Container Unloading`,
  },
  negotiating: {
    label: "Follow up on terms",
    subject: "Following up — {{warehouse_name}}",
    body: `Hi {{contact_name}},

Following up on where things stand with {{warehouse_name}}. We want to make sure the terms work well for your team, so please let me know if there's anything on your end that needs adjusting — scheduling, pricing, scope, or anything else.

Royal Westmont Container Unloading has built our business on being a dependable, long-term partner, and we're committed to getting this right for {{warehouse_name}} from the start. Happy to hop on a call or meet in person if that would help move things along.

Looking forward to hearing from you,
{{rep_name}}
Royal Westmont Container Unloading`,
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
