// pages/dienstleister/auftraege.jsx
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "../../context/UserContext";
import {
  ClipboardList,
  Briefcase,
  Home,
  MessageSquare,
  Settings,
  Receipt,
  User as UserIcon,
  CheckCircle,
} from "lucide-react";

export default function MeineAuftraege() {
  const { user } = useUser();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("angenommen");
  const [auftraege, setAuftraege] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  // 🔹 Tab automatisch anhand der URL aktivieren (z. B. ?tab=angebote)
  useEffect(() => {
    if (router.query.tab === "angebote") {
      setActiveTab("angebote");
    } else {
      setActiveTab("angenommen");
    }
  }, [router.query.tab]);

  // 🔹 Aufträge laden
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auftraege?mine=1");
        if (res.ok) {
          const data = await res.json();
          setAuftraege(Array.isArray(data) ? data : data.items || []);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Aufträge:", err);
      }
    })();
  }, []);

  // 🔹 Filterlogik (Tab + Suche)
  useEffect(() => {
    let list = [...auftraege];

    if (activeTab === "angenommen") {
      list = list.filter(
        (a) => (a.status || "").toLowerCase() === "angenommen"
      );
    } else if (activeTab === "angebote") {
      list = list.filter((a) =>
        ["offen", "angebot", "erstellt"].includes(
          (a.status || "").toLowerCase()
        )
      );
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.titel?.toLowerCase().includes(s) ||
          a.kundeVorname?.toLowerCase().includes(s) ||
          a.kundeNachname?.toLowerCase().includes(s) ||
          a.ort?.toLowerCase().includes(s)
      );
    }

    setFiltered(list);
  }, [auftraege, activeTab, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <SidebarNav />
        </aside>

        {/* Hauptinhalt */}
        <main className="col-span-12 md:col-span-9 lg:col-span-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Meine Aufträge
            </h1>
            <Link
              href="/logout"
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow"
            >
              Abmelden
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveTab("angenommen")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition 
              ${
                activeTab === "angenommen"
                  ? "bg-green-600"
                  : "bg-green-600 opacity-60 hover:opacity-80"
              }`}
            >
              <CheckCircle size={18} />
              Angenommene Aufträge
            </button>

            <button
              onClick={() => setActiveTab("angebote")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition 
              ${
                activeTab === "angebote"
                  ? "bg-blue-600"
                  : "bg-blue-600 opacity-60 hover:opacity-80"
              }`}
            >
              <Briefcase size={18} />
              Meine Angebote
            </button>
          </div>

          {/* Suche */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Suche nach Titel, Kunde oder Ort..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Tabelle */}
          <div className="bg-white shadow rounded-2xl p-4">
            {filtered.length === 0 ? (
              <p className="text-gray-600 text-sm">
                Keine {activeTab === "angebote" ? "Angebote" : "Aufträge"} gefunden.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-700">
                      <th className="py-2 px-3 font-semibold">Titel</th>
                      <th className="py-2 px-3 font-semibold">Kunde</th>
                      <th className="py-2 px-3 font-semibold">Ort</th>
                      <th className="py-2 px-3 font-semibold">Vergütung</th>
                      <th className="py-2 px-3 font-semibold">Status</th>
                      <th className="py-2 px-3 font-semibold">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr
                        key={a._id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 px-3">{a.titel || "-"}</td>
                        <td className="py-2 px-3">
                          {[a.kundeVorname, a.kundeNachname]
                            .filter(Boolean)
                            .join(" ")}
                        </td>
                        <td className="py-2 px-3">{a.ort || "-"}</td>
                        <td className="py-2 px-3">
                          {a.preis ? `${a.preis} €` : "Verhandlungsbasis"}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              (a.status || "").toLowerCase() === "angenommen"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {a.status || "-"}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <Link
                            href={`/dienstleister/auftrag/${a._id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Öffnen →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* Sidebar */
function SidebarNav() {
  const router = useRouter();
  const items = [
    { href: "/dienstleister/dashboard", label: "Dashboard", icon: Home },
    { href: "/dienstleister/profil", label: "Profil", icon: UserIcon },
    { href: "/dienstleister/auftragspool", label: "Auftragspool", icon: ClipboardList },
    { href: "/dienstleister/auftraege", label: "Meine Aufträge", icon: Briefcase },
    { href: "/dienstleister/auftraege?tab=angebote", label: "Meine Angebote", icon: Briefcase },
    { href: "/dienstleister/nachrichten", label: "Nachrichten", icon: MessageSquare },
    { href: "/dienstleister/einstellungen", label: "Einstellungen", icon: Settings },
    { href: "/dienstleister/rechnungen", label: "Rechnungen", icon: Receipt },
  ];

  return (
    <nav className="sticky top-6 rounded-2xl bg-white shadow p-2">
      <ul className="space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive =
            router.asPath === href ||
            (router.asPath.startsWith("/dienstleister/auftraege") &&
              href.includes("auftraege") &&
              label.includes("Aufträge") &&
              !router.asPath.includes("tab=angebote")) ||
            (router.asPath.includes("tab=angebote") &&
              label.includes("Angebote"));

          return (
            <li key={href}>
              <Link
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-[15px]",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <Icon
                  size={18}
                  className={isActive ? "text-blue-600" : "text-gray-500"}
                />
                <span className="font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
