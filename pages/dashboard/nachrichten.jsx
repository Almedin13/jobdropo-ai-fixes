// pages/dashboard/nachrichten.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuftraggeberLayout from "../../components/layouts/AuftraggeberLayout";
import { useUser } from "../../context/UserContext";

export default function Nachrichten() {
  const { user } = useUser();
  const router = useRouter();
  const { auftragId } = router.query; // nur noch auftragId nötig
  const [nachrichten, setNachrichten] = useState([]);
  const [nachricht, setNachricht] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const STORAGE_KEY = "lastSeenMessagesAt";

  // 🔒 Rollenprüfung
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user !== undefined && user.rolle !== "auftraggeber") {
      router.push("/dienstleister/dashboard");
    }
  }, [user, router]);

  // Beim Öffnen: "gesehen"-Zeitpunkt setzen (setzt Dashboard-Badge zurück)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
  }, []);

  // Nachrichten laden für den Auftrag
  useEffect(() => {
    if (!auftragId) {
      setInitialLoading(false);
      return;
    }
    async function ladeNachrichten() {
      try {
        const res = await fetch(`/api/nachrichten?auftragId=${auftragId}`);
        const data = await res.json();
        const items = data?.ok ? (data.items || []) : Array.isArray(data) ? data : [];
        setNachrichten(items);
      } catch (err) {
        console.error("Fehler beim Laden der Nachrichten:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    ladeNachrichten();
  }, [auftragId]);

  const sendeNachricht = async (e) => {
    e.preventDefault();
    const text = (nachricht || "").trim();
    if (!auftragId || !text) return;

    setLoading(true);
    try {
      const res = await fetch("/api/nachrichten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auftragId,
          text,
          type: "normal",
          // wichtig für Dashboard-Badge: eigene Nachrichten nicht mitzählen
          senderEmail: user?.email || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && (data?.ok || data?._id || data?.item)) {
        // lokal anhängen (optimistisch)
        setNachrichten((prev) => [
          ...prev,
          {
            _id: data?.item?._id || undefined,
            text,
            type: "normal",
            senderEmail: user?.email || undefined,
            createdAt: new Date().toISOString(),
          },
        ]);
        setNachricht("");
      } else {
        console.error("Fehler beim Senden:", data?.error || res.statusText);
      }
    } catch (err) {
      console.error("Fehler beim Senden der Nachricht:", err);
    } finally {
      setLoading(false);
    }
  };

  // UI

  return (
    <AuftraggeberLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Nachrichten</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-3 py-2 rounded border hover:bg-gray-50"
            title="Zurück zum Dashboard"
          >
            ← Zurück
          </button>
        </div>

        {!auftragId ? (
          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-600">
              Kein Auftrag ausgewählt. Öffne einen Auftrag und nutze dort die Nachrichten,
              oder rufe diese Seite mit <code>?auftragId=…</code> auf.
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Nachrichtenverlauf</h2>

            {/* Verlauf */}
            <div className="max-h-[420px] overflow-y-auto border p-4 mb-4 bg-gray-50">
              {initialLoading ? (
                <p>Lade …</p>
              ) : nachrichten.length === 0 ? (
                <p className="text-gray-500">Noch keine Nachrichten.</p>
              ) : (
                nachrichten.map((msg) => (
                  <div key={msg._id || `${msg.createdAt}-${msg.text}`} className="mb-3">
                    <p className="text-sm text-gray-600">
                      <strong>{msg.senderEmail || "Unbekannt"}</strong>{" "}
                      ({msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""})
                      {msg.type === "system" ? " · System" : ""}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Eingabe */}
            <form onSubmit={sendeNachricht} className="flex gap-2">
              <input
                type="text"
                value={nachricht}
                onChange={(e) => setNachricht(e.target.value)}
                placeholder="Nachricht schreiben..."
                className="flex-1 border p-2 rounded"
              />
              <button
                type="submit"
                disabled={loading || !nachricht.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Senden…" : "Senden"}
              </button>
            </form>
          </div>
        )}
      </div>
    </AuftraggeberLayout>
  );
}
