// pages/auftrag/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AuftraggeberLayout from "../../components/layouts/AuftraggeberLayout";
import { useUser } from "../../context/UserContext";
import ChatThread from "../../components/chat/Thread";

export default function AuftragDetailAuftraggeber() {
  const router = useRouter();
  const { user } = useUser();
  const { id } = router.query;
  const auftragId = Array.isArray(id) ? id[0] : id;

  const [auftrag, setAuftrag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbg, setDbg] = useState({ tried: [], status: [] });

  // Zugriffsschutz: nur Auftraggeber
  useEffect(() => {
    if (user === null) router.push("/login");
    else if (user !== undefined && user.rolle !== "auftraggeber") {
      router.push("/dienstleister/dashboard");
    }
  }, [user, router]);

  // Auftragsdetails laden (erst /api/auftraege/[id], Fallback /api/autraege/[id])
  useEffect(() => {
    if (!auftragId || !user) return;

    const load = async () => {
      setLoading(true);
      const ts = Date.now();
      const urls = [
        `/api/auftraege/${auftragId}?t=${ts}`,  // ✅ dein Build-Log zeigt diese Route
        `/api/autraege/${auftragId}?t=${ts}`,   // Fallback, falls die alternative Schreibweise existiert
      ];

      let found = null;
      const tried = [];
      const status = [];

      for (const url of urls) {
        tried.push(url);
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          });
          status.push(res.status);
          if (!res.ok) continue;

          const data = await res.json();
          // flexible Extraktion (verschiedene API-Formate absichern)
          const obj =
            data?.item ??
            data?.data ??
            (Array.isArray(data) ? data[0] : data) ??
            null;

          if (obj && typeof obj === "object") {
            found = obj;
            break;
          }
        } catch {
          status.push("fetch_error");
        }
      }

      setDbg({ tried, status });
      setAuftrag(found);
      setLoading(false);
    };

    load();
  }, [auftragId, user]);

  if (!user) return <p className="p-6">Bitte einloggen…</p>;

  return (
    <AuftraggeberLayout>
      {loading ? (
        <p className="p-6">Lade Auftrag…</p>
      ) : !auftrag ? (
        <div className="p-6">
          <p className="text-red-600 mb-2">Auftrag nicht gefunden.</p>
          <p className="text-xs text-gray-500">
            Debug: tried {dbg.tried.join(" , ")} | status {dbg.status.join(" , ")}
          </p>
        </div>
      ) : (
        <>
          {/* Kopf */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.back()}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
            >
              ← Zurück
            </button>
            <h1 className="text-2xl font-bold">
              Auftrag: {auftrag?.titel || "—"}
            </h1>
          </div>

          {/* Details */}
          <section className="mb-6 border rounded-lg p-4 bg-white max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <Info label="Titel" value={auftrag?.titel} />
              <Info label="Status" value={auftrag?.status || "offen"} />
              <Info label="Branche" value={auftrag?.branche} />
              <Info label="Ort" value={auftrag?.ort || "—"} />
              <Info
                label="Datum / Zeitraum"
                value={auftrag?.datumDurchfuhrung || auftrag?.zeitraum || "—"}
              />
              <Info label="Turnus" value={auftrag?.turnus} />
              <Info
                label="Vergütung / Budget"
                value={auftrag?.preis || "nach Vereinbarung"}
              />
              <Info
                label="Erstellt am"
                value={
                  auftrag?.erstelltAm
                    ? new Date(auftrag.erstelltAm).toLocaleString()
                    : "—"
                }
              />
            </div>

            {auftrag?.beschreibung && (
              <div className="mt-4">
                <div className="text-gray-500 mb-1">Beschreibung</div>
                <p className="whitespace-pre-wrap">{auftrag.beschreibung}</p>
              </div>
            )}

            {Array.isArray(auftrag?.bilder) && auftrag.bilder.length > 0 && (
              <div className="mt-4">
                <div className="text-gray-500 mb-2">Anhänge</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {auftrag.bilder.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block border rounded overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Bild ${i + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Chat direkt im Auftrag (Rolle: Auftraggeber) */}
          <section className="mb-10 border rounded-lg p-4 bg-white max-w-3xl">
            <h2 className="text-lg font-semibold mb-3">Nachrichten</h2>
            <ChatThread auftragId={auftragId} myRole="auftraggeber" />
          </section>
        </>
      )}
    </AuftraggeberLayout>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}
