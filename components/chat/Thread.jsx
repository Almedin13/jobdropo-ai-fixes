// components/chat/Thread.jsx
import { useEffect, useMemo, useRef, useState } from "react";

export default function ChatThread({ auftragId: rawId, myRole }) {
  const auftragId = useMemo(() => (Array.isArray(rawId) ? rawId[0] : rawId), [rawId]);
  const [nachrichten, setNachrichten] = useState([]);
  const [text, setText] = useState("");
  const listRef = useRef(null);
  const pollRef = useRef(null);

  // Normalisierung
  const norm = (m) => {
    const inhalt = m?.inhalt ?? m?.text ?? m?.message ?? "";
    const zeitRaw = m?.zeitpunkt ?? m?.createdAt ?? m?.timestamp;
    const zeitpunkt = zeitRaw ? new Date(zeitRaw).toISOString() : new Date().toISOString();
    const von = m?.von ?? m?.senderRole ?? m?.sender ?? "system";
    const an = m?.an ?? m?.receiverRole ?? m?.to ?? undefined;
    return { von, an, inhalt, zeitpunkt };
  };

  // Laden
  const loadMsgs = async () => {
    if (!auftragId) return;
    const ts = Date.now();
    const fetchNoCache = (u) =>
      fetch(`${u}${u.includes("?") ? "&" : "?"}t=${ts}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });

    let raw = [];
    try {
      let r = await fetchNoCache(`/api/nachrichten/${auftragId}`);
      if (!r.ok) r = await fetchNoCache(`/api/nachrichten?auftragId=${encodeURIComponent(auftragId)}`);
      raw = r.ok ? await r.json() : [];
    } catch {}
    setNachrichten(
      (Array.isArray(raw) ? raw : raw?.nachrichten || raw?.messages || raw?.data || [])
        .map(norm)
        .sort((a, b) => new Date(a.zeitpunkt) - new Date(b.zeitpunkt))
    );
  };

  useEffect(() => {
    if (!auftragId) return;
    loadMsgs();
    pollRef.current = setInterval(loadMsgs, 5000);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [auftragId]);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [nachrichten.length]);

  // Senden (Enter), Shift+Enter = Zeilenumbruch (kein Hinweis im UI mehr)
  const send = async (e) => {
    if (e) e.preventDefault();
    const t = text.trim();
    if (!t || !auftragId) return;

    const optimistic = {
      von: myRole,
      an: myRole === "auftraggeber" ? "dienstleister" : "auftraggeber",
      inhalt: t,
      zeitpunkt: new Date().toISOString(),
      _optimistic: true,
    };
    setNachrichten((p) => [...p, optimistic]);
    setText("");

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    try {
      let res = await fetch(`/api/nachrichten/${auftragId}?t=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({ von: optimistic.von, an: optimistic.an, inhalt: t }),
      });
      if (!res.ok) {
        res = await fetch(`/api/nachrichten?t=${Date.now()}`, {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
          body: JSON.stringify({ auftragId, von: optimistic.von, an: optimistic.an, inhalt: t }),
        });
      }
      if (res.ok) await loadMsgs();
    } finally {
      if (!pollRef.current) pollRef.current = setInterval(loadMsgs, 5000);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border rounded p-4 bg-gray-50">
      <div ref={listRef} className="h-80 overflow-y-auto mb-3">
        {nachrichten.length === 0 ? (
          <p className="text-gray-500">Noch keine Nachrichten.</p>
        ) : (
          nachrichten.map((m, i) => (
            <div
              key={`${i}-${m.zeitpunkt}`}
              className={`mb-2 p-2 rounded border ${
                m.von === myRole ? "bg-green-100 text-right border-green-200" : "bg-gray-200 text-left border-gray-300"
              }`}
            >
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{m.inhalt || "—"}</p>
              <p className="text-xs text-gray-600">{new Date(m.zeitpunkt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 items-end">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nachricht schreiben..."
          aria-label="Nachricht schreiben"
          className="flex-1 px-3 py-2 border rounded resize-none"
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" disabled={!text.trim()}>
          Senden
        </button>
      </form>
    </div>
  );
}
