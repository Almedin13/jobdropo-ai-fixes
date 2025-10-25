import { useEffect, useState } from "react";

export default function NachrichtenBox({ auftragId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/nachrichten?auftragId=${auftragId}`);
      const data = await res.json();
      const arr = data?.ok ? (data.items || []) : [];
      setItems(arr);
    } catch (e) {
      console.error("Nachrichten laden fehlgeschlagen:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (auftragId) load();
  }, [auftragId]);

  if (!auftragId) return null;

  return (
    <section className="mt-6 border rounded p-4 bg-white max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Nachrichten</h3>
        <button className="text-sm px-2 py-1 border rounded" onClick={load} disabled={loading}>
          {loading ? "…" : "Aktualisieren"}
        </button>
      </div>

      {loading ? (
        <p>Lade …</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Noch keine Nachrichten.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m._id} className="border rounded p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-gray-200">
                  {m.type === "system" ? "System" : "Nachricht"}
                </span>
                <span className="text-xs text-gray-500">
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                </span>
              </div>
              <div className="whitespace-pre-wrap">{m.text}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
