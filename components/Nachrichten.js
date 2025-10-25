import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

export default function Nachrichten() {
  const { user } = useUser();
  const [nachrichten, setNachrichten] = useState([]);
  const [neueNachricht, setNeueNachricht] = useState("");

  // Beispielhaft: Fester Auftrag für die erste Version
  const auftragId = "demo123"; // Das sollte später dynamisch sein

  useEffect(() => {
    async function fetchNachrichten() {
      try {
        const res = await fetch(`/api/nachrichten?auftragId=${auftragId}`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setNachrichten(data);
        } else {
          console.warn("⚠️ Erwartetes Array von Nachrichten, erhalten:", data);
          setNachrichten([]);
        }
      } catch (err) {
        console.error("❌ Fehler beim Laden der Nachrichten:", err);
      }
    }

    fetchNachrichten();
  }, [auftragId]);

  const handleNachrichtSenden = async (e) => {
    e.preventDefault();
    if (!neueNachricht.trim()) return;

    try {
      const res = await fetch("/api/nachrichten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auftragId,
          sender: user?.email || "unbekannt",
          senderType: "auftraggeber",
          text: neueNachricht,
        }),
      });

      if (res.ok) {
        // Neue Nachricht manuell einfügen (oder Neuladen)
        const newEntry = {
          sender: user?.email || "unbekannt",
          senderType: "auftraggeber",
          text: neueNachricht,
          gesendetAm: new Date().toISOString(),
        };
        setNachrichten((prev) => [...prev, newEntry]);
        setNeueNachricht("");
      }
    } catch (err) {
      console.error("❌ Fehler beim Senden der Nachricht:", err);
    }
  };

  return (
    <div className="w-full px-8 py-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Nachrichten zu Auftrag</h2>

      <div className="max-h-96 overflow-y-auto border p-4 mb-4 bg-gray-50">
        {Array.isArray(nachrichten) && nachrichten.length > 0 ? (
          nachrichten.map((msg, index) => (
            <div key={index} className="mb-2">
              <p className="text-sm text-gray-600">
                <strong>{msg.sender || msg.absender}</strong>{" "}
                ({new Date(msg.gesendetAm || msg.zeitstempel).toLocaleString()})
              </p>
              <p>{msg.text}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Keine Nachrichten vorhanden.</p>
        )}
      </div>

      <form onSubmit={handleNachrichtSenden} className="flex gap-2">
        <input
          type="text"
          value={neueNachricht}
          onChange={(e) => setNeueNachricht(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="Nachricht schreiben..."
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Senden
        </button>
      </form>
    </div>
  );
}
