// components/navigation/DLSidebar.jsx
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Home, User, ClipboardList, Briefcase, MessageSquare, Settings, Receipt
} from "lucide-react";

const NAV = [
  { href: "/dienstleister/dashboard",    label: "Dashboard",       icon: Home },
  { href: "/dienstleister/profil",       label: "Profil",          icon: User },
  { href: "/dienstleister/auftragspool", label: "Auftragspool",    icon: ClipboardList },
  { href: "/dienstleister/angebote",     label: "Meine Angebote",  icon: Briefcase },
  { href: "/dienstleister/nachrichten",  label: "Nachrichten",     icon: MessageSquare },
  { href: "/dienstleister/einstellungen",label: "Einstellungen",   icon: Settings },
  { href: "/dienstleister/rechnungen",   label: "Rechnungen",      icon: Receipt },
];

export default function DLSidebar() {
  const router = useRouter();
  return (
    <nav className="sticky top-6 rounded-2xl bg-white shadow p-2">
      <ul className="space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = router.pathname === href || router.pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-[15px] no-underline hover:no-underline",
                  active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <Icon size={18} className={active ? "text-blue-600" : "text-gray-500"} />
                <span className="font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
