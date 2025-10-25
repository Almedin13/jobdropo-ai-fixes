// components/chat/ChatPanel.jsx
import { useEffect, useMemo, useRef, useState } from "react";

export default function ChatPanel({ auftragId, role = "dienstleister" }) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [nachrichten, setNachrichten] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);
  const pollRef = useRef(null);

  const normalizeMsg = (m) => {
    const inhalt = m?.inhalt ?? m?.text ?? m?.message ?? m?.content ?? m?.msg ?? "";
    const zeitRaw = m?.zeitpunkt ?? m?.createdAt ?? m?.created_at ?? m?.date ?? m?.timestamp;
    const zeitpunkt = zeitRaw ? new Date(zeitRaw).toISOString() : new Date().toISOString();
    const von = m?.von ?? m?.senderRole ?? m?.senderType ?? m?.sender ?? m?.from ?? "system";
    const an = m?.an ?? m?.receiverRole ?? m?.empfaenger ?? m?.to ?? undefined;
    return { von, an, inhalt, zeitpunkt };
  };

  const laden = async () => {
    if (!auftragId) return;
    try {
      const res = await fetch(`/api/nachrichten/${auftragId}?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const raw = res.ok ? await res.json() : [];
      const arr = (Array.isArray(raw) ? raw : (raw?.nachrichten || raw?.messages || raw?.data || []))
        .map(normalizeMsg)
        .sort((a, b) => new Date(a.zeitpunkt) - new Date(b.zeitpunkt));
      setNachrichten(arr);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setNachrichten([]);
    if (!auftragId) return;
    laden();
    pollRef.current = setInterval(laden, 5000);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [auftragId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [nachrichten.length]);

  const handleNachrichtSenden = async () => {
    const trimmed = text.trim();
    if (!trimmed) { setFeedback("❌ Bitte Text eingeben."); return; }
    if (!auftragId) { setFeedback("❌ Keine Auftrags-ID gefunden."); return; }

    const other = role === "dienstleister" ? "auftraggeber" : "dienstleister";
    const optimistic = {
      von: role, an: other, inhalt: trimmed, zeitpunkt: new Date().toISOString(), _optimistic: true,
    };
    setNachrichten((prev) => [...prev, optimistic]);
    setText("");

    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    try {
      const res = await fetch(`/api/nachrichten/${auftragId}?t=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({ von: role, an: other, inhalt: trimmed }),
      });
      if (!res.ok) throw new Error("send_failed");
      setFeedback("✅ Nachricht gesendet");
      await laden();
    } catch (e) {
      setFeedback("❌ Fehler beim Senden");
      setNachrichten((prev) => prev.filter((m) => m !== optimistic));
      setText(trimmed);
    } finally {
      if (!pollRef.current) pollRef.current = setInterval(laden, 5000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleNachrichtSenden();
    }
  };

  return (
    <div id="chat" className="bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Nachrichten</h3>

      <div ref={listRef} className="border rounded p-4 h-96 overflow-y-auto mb-4 bg-gray-50">
        {loading ? (
          <p className="text-gray-500">Lade Nachrichten...</p>
        ) : nachrichten.length === 0 ? (
          <p className="text-gray-500">Noch keine Nachrichten.</p>
        ) : (
          nachrichten.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 p-2 rounded ${
                msg.von === "dienstleister"
                  ? "bg-green-100 text-right"
                  : msg.von === "system"
                  ? "bg-yellow-100 text-center"
                  : "bg-gray-200 text-left"
              }`}
            >
              <p className="text-sm break-words">{msg.inhalt}</p>
              <p className="text-xs text-gray-500">
                {new Date(msg.zeitpunkt).toLocaleString("de-DE")}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-4 py-2 border rounded"
          placeholder="Nachricht schreiben..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleNachrichtSenden}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Senden
        </button>
      </div>

      {feedback && <p className="mt-3">{feedback}</p>}
    </div>
  );
}
