import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router";
import DienstleisterLayout from "../../components/layouts/DienstleisterLayout";

export default function Auftragspool() {
  const { user } = useUser();
  const router = useRouter();

  const [auftraege, setAuftraege] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔍 Filter-States
  const [suchbegriff, setSuchbegriff] = useState("");
  const [filterBranche, setFilterBranche] = useState("");
  const [filterTurnus, setFilterTurnus] = useState("");
  const [filterEntfernung, setFilterEntfernung] = useState("");

  // Auth / Rollen-Check wie gehabt
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user !== undefined && user?.rolle !== "dienstleister") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Aufträge laden (verfügbar)
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();

    const fetchAuftraege = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auftraege/verfuegbar", { signal: controller.signal });
        const data = res.ok ? await res.json() : [];
        setAuftraege(Array.isArray(data) ? data : data.items || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Fehler beim Laden der Aufträge:", error);
          setAuftraege([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAuftraege();
    return () => controller.abort();
  }, [user]);

  // Optionen dynamisch aus den Daten
  const branchenOptions = useMemo(
    () => Array.from(new Set(auftraege.map(a => a?.branche).filter(Boolean))),
    [auftraege]
  );
  const turnusOptions = useMemo(
    () => Array.from(new Set(auftraege.map(a => a?.turnus).filter(Boolean))),
    [auftraege]
  );

  // 🔍 Filterlogik (unverändert, aber in useMemo)
  const gefilterteAuftraege = useMemo(() => {
    return auftraege.filter((auftrag) => {
      const matchesSuche =
        suchbegriff === "" ||
        (auftrag.titel || "").toLowerCase().includes(suchbegriff.toLowerCase()) ||
        (auftrag.beschreibung || "").toLowerCase().includes(suchbegriff.toLowerCase());

      const matchesBranche = filterBranche === "" || auftrag.branche === filterBranche;
      const matchesTurnus = filterTurnus === "" || auftrag.turnus === filterTurnus;
      const matchesEntfernung =
        filterEntfernung === "" ||
        (auftrag.entfernung && Number(auftrag.entfernung) <= parseInt(filterEntfernung, 10));

      return matchesSuche && matchesBranche && matchesTurnus && matchesEntfernung;
    });
  }, [auftraege, suchbegriff, filterBranche, filterTurnus, filterEntfernung]);

  // Ungeloggt: kurze Info (kein Layout rendern)
  if (!user) return <p className="text-center mt-10">Bitte einloggen...</p>;

  return (
    <DienstleisterLayout title="Auftragspool">
      {/* Intro */}
      <p className="text-gray-600 mb-6">
        Hier findest du alle offenen Aufträge und kannst dich direkt bewerben.
      </p>

      {/* 🔎 Filterleiste – aufgeräumt & einheitlich */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-lg text-gray-900">Filter & Suche</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            className="px-3 py-2 border border-gray-200 rounded-xl w-full"
            placeholder="Auftragstitel oder Beschreibung suchen"
            value={suchbegriff}
            onChange={(e) => setSuchbegriff(e.target.value)}
          />
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl w-full"
            value={filterBranche}
            onChange={(e) => setFilterBranche(e.target.value)}
          >
            <option value="">Alle Branchen</option>
            {branchenOptions.map((branche) => (
              <option key={branche} value={branche}>{branche}</option>
            ))}
          </select>
          <select
            className="px-3 py-2 border border-gray-200 rounded-xl w-full"
            value={filterTurnus}
            onChange={(e) => setFilterTurnus(e.target.value)}
          >
            <option value="">Alle Turnus</option>
            {turnusOptions.map((turnus) => (
              <option key={turnus} value={turnus}>{turnus}</option>
            ))}
          </select>
          <input
            type="number"
            className="px-3 py-2 border border-gray-200 rounded-xl w-full"
            placeholder="Entfernung max. (km)"
            value={filterEntfernung}
            onChange={(e) => setFilterEntfernung(e.target.value)}
          />
        </div>
      </div>

      {/* Liste */}
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Verfügbare Aufträge</h2>

      <div className="rounded-2xl bg-white shadow p-4">
        {loading ? (
          <p className="text-gray-600">Lade Aufträge...</p>
        ) : gefilterteAuftraege.length === 0 ? (
          <p className="text-gray-600">Keine passenden Aufträge gefunden.</p>
        ) : (
          <ul className="flex flex-col gap-6">
            {gefilterteAuftraege.map((auftrag) => (
              <li key={auftrag._id} className="border border-gray-100 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {auftrag.titel || "Ohne Titel"}
                </h3>

                {auftrag.beschreibung && (
                  <p className="text-sm text-gray-700 mb-2">
                    {auftrag.beschreibung.length > 160
                      ? `${auftrag.beschreibung.slice(0, 160)}…`
                      : auftrag.beschreibung}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-3">
                  {auftrag.kundeVorname || auftrag.kundeNachname ? (
                    <span>
                      {(auftrag.kundeVorname || "") + " " + (auftrag.kundeNachname || "")}
                    </span>
                  ) : null}
                  {[auftrag.strasse, auftrag.plz, auftrag.ort].filter(Boolean).length > 0 && (
                    <span>{[auftrag.strasse, auftrag.plz, auftrag.ort].filter(Boolean).join(", ")}</span>
                  )}
                  {auftrag.entfernung != null && (
                    <span>Entfernung: {Number(auftrag.entfernung)} km</span>
                  )}
                  {auftrag.turnus && <span>Turnus: {auftrag.turnus}</span>}
                  {auftrag.branche && <span>Branche: {auftrag.branche}</span>}
                  {auftrag.datumDurchfuehrung && (
                    <span>Ausführung: {formatDate(auftrag.datumDurchfuehrung)}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/dienstleister/auftrag/${auftrag._id}`}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-blue-700 hover:bg-blue-50"
                  >
                    Auftrag ansehen
                  </Link>

                  <Link href={`/dienstleister/auftrag/${auftrag._id}?compose=message`}>
                    <button className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                      Nachricht schreiben
                    </button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DienstleisterLayout>
  );
}

/* ---------- Helper ---------- */
function formatDate(d) {
  try {
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return d;
  }
}
