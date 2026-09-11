import { Phone, MessageSquare, Mail, MapPin } from "lucide-react";

export default function ContactLinks({
  phone,
  email,
  address,
}: {
  phone?: string | null;
  email?: string | null;
  address: string;
}) {
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <a
        href={mapsHref}
        target="_blank"
        rel="noreferrer"
        className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-medium text-slate-600"
      >
        <MapPin size={20} className="text-blue-600" />
        Directions
      </a>
      <a
        href={phone ? `tel:${phone}` : undefined}
        aria-disabled={!phone}
        className={`flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-medium text-slate-600 ${!phone ? "pointer-events-none opacity-40" : ""}`}
      >
        <Phone size={20} className="text-blue-600" />
        Call
      </a>
      <a
        href={phone ? `sms:${phone}` : undefined}
        aria-disabled={!phone}
        className={`flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-medium text-slate-600 ${!phone ? "pointer-events-none opacity-40" : ""}`}
      >
        <MessageSquare size={20} className="text-blue-600" />
        Text
      </a>
      <a
        href={email ? `mailto:${email}` : undefined}
        aria-disabled={!email}
        className={`flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-medium text-slate-600 ${!email ? "pointer-events-none opacity-40" : ""}`}
      >
        <Mail size={20} className="text-blue-600" />
        Email
      </a>
    </div>
  );
}
