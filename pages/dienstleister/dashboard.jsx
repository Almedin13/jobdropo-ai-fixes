import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "../../context/UserContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Home,
  User as UserIcon,
  ClipboardList,
  Briefcase,
  MessageSquare,
  Settings,
  Receipt,
  BarChart2,
} from "lucide-react";

export default function DashboardDL() {
  const { user } = useUser() || {};
  const router = useRouter();

  // Darkmode Reset
  useEffect(() => {
    try {
      document.documentElement.classList.remove("dark");
      localStorage.removeItem("dl_theme");
      localStorage.removeItem("dl_dark_mode");
    } catch {}
  }, []);

  // KPI-Daten
  const [kpi, setKpi] = useState({ pool: 0, unread: 0, angebote: 0 });
  const [ordersOpen, setOrdersOpen] = useState([]);
  const [ordersAccepted, setOrdersAccepted] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingOrders(true);
      try {
        const [ordersRes, unreadRes, angebotRes] = await Promise.all([
          fetch("/api/auftraege?mine=1"),
          fetch("/api/nachrichten/unread-count"),
          fetch("/api/angebote?mine=1&countOnly=1"),
        ]);

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const list = Array.isArray(data) ? data : data.items || [];

          const offene = list.filter(
            (o) =>
              !["angenommen", "akzeptiert", "abgeschlossen"].includes(
                (o.status || "").toLowerCase()
              )
          );
          const angenommene = list.filter((o) =>
            ["angenommen", "akzeptiert"].includes((o.status || "").toLowerCase())
          );

          setOrdersOpen(offene);
          setOrdersAccepted(angenommene);

          const unread = unreadRes.ok ? (await unreadRes.json())?.count ?? 0 : 0;
          const angebote = angebotRes.ok
            ? (await angebotRes.json())?.count ?? 0
            : 0;

          setKpi({
            pool: offene.length,
            unread,
            angebote,
          });
        }
      } catch {
        setOrdersOpen([]);
        setOrdersAccepted([]);
        setKpi({ pool: 0, unread: 0, angebote: 0 });
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, []);

  // 📊 Statistik
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("");
  const [years, setYears] = useState([]);
  const months = [
    "Jan",
    "Feb",
    "Mär",
    "Apr",
    "Mai",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dez",
  ];

  useEffect(() => {
    if (!ordersAccepted.length) return;

    const map = {};
    const yearSet = new Set();

    ordersAccepted.forEach((o) => {
      let dateObj = null;
      const rawDate = o.startDatum || o.datum || o.datumDurchfuehrung;

      if (rawDate && !isNaN(new Date(rawDate))) dateObj = new Date(rawDate);

      if (!dateObj && o.anzeigeText) {
        const match = o.anzeigeText.match(/(\d{2}\.\d{2}\.\d{4})/);
        if (match && match[1]) {
          const [day, month, year] = match[1].split(".");
          dateObj = new Date(`${year}-${month}-${day}`);
        }
      }

      if (!dateObj || isNaN(dateObj)) dateObj = new Date();

      const key = dateObj.toLocaleString("de-DE", {
        month: "short",
        year: "2-digit",
      });
      map[key] = (map[key] || 0) + 1;
      yearSet.add(dateObj.getFullYear());
    });

    const now = new Date();
    const monthsArr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("de-DE", { month: "short", year: "2-digit" });
      monthsArr.push({ month: key, auftraege: map[key] || 0 });
    }

    setYears(Array.from(yearSet).sort((a, b) => b - a));
    setMonthlyStats(monthsArr);
  }, [ordersAccepted]);

  const filteredStats = useMemo(() => {
    return monthlyStats.filter((item) => {
      const [monthShort, yearShort] = item.month.split(" ");
      const yearFull = "20" + yearShort;
      const monthIndex = months.findIndex((m) => m.startsWith(monthShort));
      const matchYear = Number(yearFull) === Number(selectedYear);
      const matchMonth =
        selectedMonth === "" || monthIndex === Number(selectedMonth);
      return matchYear && matchMonth;
    });
  }, [monthlyStats, selectedYear, selectedMonth]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-0 px-0 lg:px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2">
            <SidebarNav />
          </aside>

          {/* Hauptinhalt */}
          <main className="col-span-12 md:col-span-9 lg:col-span-10">
            {/* Begrüßung */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {greeting()}, {user?.firstName || "Almedin"} 👋
                </h1>
                <p className="text-gray-600">
                  Willkommen in deinem persönlichen Dienstleister-Dashboard
                </p>
              </div>
              <Link
                href="/logout"
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow"
              >
                Abmelden
              </Link>
            </div>

            {/* KPI-Karten */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <KpiCard
                title="Auftragspool öffnen"
                value={kpi.pool}
                href="/dienstleister/auftragspool"
                subtitle="Ansehen →"
                bg="bg-blue-600"
              />
              <KpiCard
                title="Zu den Nachrichten"
                value={kpi.unread}
                href="/dienstleister/nachrichten"
                subtitle="Ansehen →"
                bg="bg-purple-600"
              />
              <KpiCard
                title="Meine Aufträge"
                value={kpi.angebote}
                href="/dienstleister/angebote"
                subtitle="Ansehen →"
                bg="bg-green-600"
              />
            </div>

            {/* Neueste Aufträge */}
            <div className="rounded-2xl bg-white shadow p-5 mb-6">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <h2 className="text-xl font-bold text-gray-900">
                  Neueste Aufträge
                </h2>
                <Link
                  href="/dienstleister/auftragspool"
                  className="text-base text-blue-600 font-medium hover:underline"
                >
                  Alle Aufträge ansehen →
                </Link>
              </div>

              {loadingOrders ? (
                <p className="text-gray-600">Lade…</p>
              ) : ordersOpen.length === 0 ? (
                <p className="text-gray-600">Keine neuen Aufträge verfügbar.</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {ordersOpen.slice(0, 5).map((o) => (
                    <div
                      key={o._id}
                      className="grid grid-cols-1 md:grid-cols-12 items-center py-4 gap-4"
                    >
                      <div className="md:col-span-6">
                        <div className="font-semibold text-gray-900">
                          {o.titel || "Unbenannter Auftrag"} •{" "}
                          {o.anzeigeText
                            ? o.anzeigeText
                            : [o.startDatum, o.endDatum].filter(Boolean).length
                            ? `${formatDate(o.startDatum)} – ${formatDate(
                                o.endDatum
                              )}`
                            : formatDate(
                                o.datumDurchfuehrung || o.datum || "-"
                              )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {[o.strasse, o.plz, o.ort]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          {o.beschreibung
                            ? o.beschreibung.length > 100
                              ? o.beschreibung.slice(0, 100) + "…"
                              : o.beschreibung
                            : "Keine Beschreibung angegeben."}
                        </div>
                      </div>

                      <div className="md:col-span-3 text-center">
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                          Vergütung
                        </p>
                        <p className="text-lg font-semibold text-gray-800">
                          {o.preis && !isNaN(o.preis)
                            ? `${o.preis} €`
                            : "Verhandlungsbasis"}
                        </p>
                      </div>

                      <div className="md:col-span-3 text-right">
                        <Link
                          href={`/dienstleister/auftrag/${o._id}`}
                          className="text-blue-600 hover:underline text-base font-medium whitespace-nowrap"
                        >
                          Öffnen →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 📊 Meine Auftragsstatistik */}
            <div className="rounded-2xl bg-white shadow p-5 mt-6">
              <div className="flex items-center justify-between mb-3 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart2 size={18} className="text-green-600" />
                  Meine Auftragsstatistik
                </h2>
                <span className="text-sm text-gray-500">
                  Nur angenommene Aufträge
                </span>
              </div>

              {/* Filter */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div>
                  <label className="text-sm text-gray-600 font-medium">
                    Jahr:
                  </label>
                  <select
                    className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {years.length === 0 && (
                      <option value={new Date().getFullYear()}>
                        {new Date().getFullYear()}
                      </option>
                    )}
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-600 font-medium">
                    Monat:
                  </label>
                  <select
                    className="ml-2 border border-gray-300 rounded-md px-2 py-1 text-sm"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="">Alle</option>
                    {months.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Zusammenfassung */}
              <div className="mb-3 text-gray-700 text-sm font-medium">
                {(() => {
                  const total = filteredStats.reduce(
                    (sum, m) => sum + m.auftraege,
                    0
                  );
                  if (selectedMonth === "") {
                    return `Insgesamt ${total} angenommene Aufträge im Jahr ${selectedYear}`;
                  } else {
                    const monthName = months[selectedMonth];
                    return `${total} angenommene Aufträge im ${monthName} ${selectedYear}`;
                  }
                })()}
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredStats}
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [`${value} Aufträge`, "Anzahl"]}
                      labelFormatter={(label) => `Monat: ${label}`}
                    />
                    <Bar
                      dataKey="auftraege"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </main>
        </div>
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
    { href: "/dienstleister/nachrichten", label: "Nachrichten", icon: MessageSquare },
    { href: "/dienstleister/einstellungen", label: "Einstellungen", icon: Settings },
    { href: "/dienstleister/rechnungen", label: "Rechnungen", icon: Receipt },
  ];
  return (
    <nav className="sticky top-6 rounded-2xl bg-white shadow p-2">
      <ul className="space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            router.pathname === href || router.pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-[15px] no-underline hover:no-underline",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <Icon
                  size={18}
                  className={active ? "text-blue-600" : "text-gray-500"}
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

/* Komponenten */
function KpiCard({ title, value, href, subtitle, bg }) {
  return (
    <Link
      href={href}
      className={[
        "group block rounded-2xl text-white hover:text-white no-underline hover:no-underline",
        "shadow transform transition-transform hover:-translate-y-0.5",
        bg,
      ].join(" ")}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="opacity-90 text-sm mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-sm font-bold">
            {Number(value) || 0}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* Helpers */
function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 17) return "Guten Tag";
  return "Guten Abend";
}

function formatDate(d) {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date)) return d;
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
}
