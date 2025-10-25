import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "../../../context/UserContext";

export default function AuftraggeberNachrichten() {
  const router = useRouter();
  const { user } = useUser();
  const myRole = "auftraggeber";

  // auftragId robust bestimmen (Param ODER URL-Fallback)
  const auftragParam = router.query.auftrag;
  const auftragId = useMemo(() => {
    const q = Array.isArray(auftragParam) ? auftragParam[0] : auftragParam;
    if (q) return q;
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split("/");
      return parts[parts.length - 1] || undefined;
    }
    return undefined;
  }, [auftragParam]);

  const [nachrichten, setNachrichten] = useState([]);
  const [neueNachricht, setNeueNachricht] = useState("");
  const [loading, setLoading] = useState(true);

  const [auftrag, setAuftrag] = useState(null);
  const [auftragLoading, setAuftragLoading] = useState(true);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  // --- Debug-Infos ---
  const [dbg, setDbg] = useState({
    lastGetStatus: null,
    lastPostStatus: null,
    lastError: null,
  });

  // --- Normalizer für Nachrichten ---
  const normalizeMsg = (m) => {
    const inhalt = m?.inhalt ?? m?.text ?? m?.message ?? m?.content ?? m?.msg ?? "";
    const zeitRaw = m?.zeitpunkt ?? m?.createdAt ?? m?.created_at ?? m?.date ?? m?.timestamp;
    const zeitpunkt = zeitRaw ? new Date(zeitRaw).toISOString() : new Date().toISOString();
    const von = m?.von ?? m?.senderRole ?? m?.senderType ?? m?.sender ?? m?.from ?? "system";
    const an = m?.an ?? m?.receiverRole ?? m?.empfaenger ?? m?.to ?? undefined;
    return { von, an, inhalt, zeitpunkt };
  };

  // --- Normalizer für Auftragsdetails ---
  const normalizeOrder = (raw) => {
    if (!raw || typeof raw !== "object") return null;
    const title = raw.titel ?? raw.title ?? raw.name ?? raw.orderTitle ?? `Auftrag ${auftragId}`;
    const beschreibung = raw.beschreibung ?? raw.description ?? raw.details ?? "";
    const status = raw.status ?? raw.state ?? raw.orderStatus ?? "";
    const createdAt = raw.createdAt ?? raw.erstelltAm ?? raw.erstellt ?? raw.datum ?? null;
    const ort = raw.ort ?? raw.location ?? raw.city ?? "";
    const plz = raw.plz ?? raw.postleitzahl ?? raw.zip ?? "";
    const strasse = raw.strasse ?? raw.adresse ?? raw.street ?? "";
    return { title, beschreibung, status, createdAt, ort, plz, strasse };
  };

  // --- Nachrichten laden (Primärroute + Fallback) ---
  const ladenNachrichten = async () => {
    if (!auftragId) { setLoading(false); return; }
    const ts = Date.now();
    const fetchNoCache = (url) =>
      fetch(`${url}${url.includes("?") ? "&" : "?"}t=${ts}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });

    try {
      let r = await fetchNoCache(`/api/nachrichten/${auftragId}`);
      if (!r.ok) r = await fetchNoCache(`/api/nachrichten?auftragId=${encodeURIComponent(auftragId)}`);
      const status = r.status;
      const raw = r.ok ? await r.json() : [];
      const list = (Array.isArray(raw) ? raw : (raw?.nachrichten || raw?.messages || raw?.data || raw?.items || []))
        .map(normalizeMsg)
        .sort((a, b) => new Date(a.zeitpunkt) - new Date(b.zeitpunkt)); // alt → neu
      setNachrichten(list);
      setDbg((d) => ({ ...d, lastGetStatus: status, lastError: null }));
    } catch (e) {
      setNachrichten([]);
      setDbg((d) => ({ ...d, lastGetStatus: "fetch_error", lastError: String(e) }));
    } finally {
      setLoading(false);
    }
  };

  // --- Auftragsdetails laden ---
  const ladenAuftrag = async () => {
    if (!auftragId) { setAuftragLoading(false); return; }
    setAuftragLoading(true);
    try {
      const res = await fetch(`/api/autraege/${auftragId}?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      if (!res.ok) setAuftrag(null);
      else setAuftrag(normalizeOrder(await res.json()));
    } catch {
      setAuftrag(null);
    } finally {
      setAuftragLoading(false);
    }
  };

  // initial laden + polling
  useEffect(() => {
    if (!auftragId) return;
    ladenNachrichten();
    ladenAuftrag();
    pollRef.current = setInterval(ladenNachrichten, 5000);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [auftragId]);

  // immer nach unten scrollen
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [nachrichten.length]);

  // nach erstem Laden Fokus setzen
  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  // --- Senden (optimistisch + no-cache) ---
  const senden = async (e) => {
    if (e) e.preventDefault();
    const text = neueNachricht.trim();
    if (!text || !auftragId) return;

    const optimistic = {
      von: myRole,
      an: "dienstleister",
      inhalt: text,
      zeitpunkt: new Date().toISOString(),
      _optimistic: true,
    };
    setNachrichten((prev) => [...prev, optimistic]); // SOFORT sichtbar
    setLoading(false);
    setNeueNachricht("");
    requestAnimationFrame(() => inputRef.current?.focus());

    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    try {
      const res = await fetch(`/api/nachrichten/${auftragId}?t=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({ von: myRole, an: "dienstleister", inhalt: text }),
      });
      setDbg((d) => ({ ...d, lastPostStatus: res.status }));
      if (!res.ok) throw new Error("send_failed");
      await ladenNachrichten(); // echte Daten ziehen
    } catch (err) {
      setDbg((d) => ({ ...d, lastError: String(err) }));
      setNachrichten((prev) => prev.filter((m) => m !== optimistic));
      setNeueNachricht(text);
      requestAnimationFrame(() => inputRef.current?.focus());
    } finally {
      if (!pollRef.current) pollRef.current = setInterval(ladenNachrichten, 5000);
    }
  };

  // Enter = senden, Shift+Enter = Zeilenumbruch
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      senden();
    }
  };

  if (!user) return <p className="p-4">Bitte einloggen...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Auftragsdetails */}
      <div className="border rounded mb-4 p-4 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {auftragLoading ? "Auftragsdetails laden…" : (auftrag?.title || `Auftrag ${auftragId}`)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {auftragLoading ? "Bitte kurz warten…" : (auftrag?.beschreibung || "—")}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs px-2 py-1 rounded bg-gray-100">
              {auftragLoading ? "…" : (auftrag?.status || "—")}
            </span>
            {auftrag?.ort || auftrag?.plz || auftrag?.strasse ? (
              <div className="text-xs text-gray-500 mt-1">
                {[auftrag?.strasse, auftrag?.plz, auftrag?.ort].filter(Boolean).join(", ")}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Chat */}
      <h1 className="text-xl font-bold mb-4">Nachrichten zu deinem Auftrag</h1>

      <div
        ref={listRef}
        className="border rounded p-4 h-96 overflow-y-auto mb-4 bg-gray-50"
      >
        {/* Auch wenn loading===true, rendern wir die Liste, damit Optimistic sichtbar ist */}
        {nachrichten.length === 0 ? (
          <p className="text-gray-500">{loading ? "Lade Nachrichten..." : "Noch keine Nachrichten."}</p>
        ) : (
          nachrichten.map((msg, idx) => (
            <div
              key={`${idx}-${msg.zeitpunkt}`}
              className={`mb-2 p-2 rounded border ${
                msg.von === myRole
                  ? "bg-green-100 text-right border-green-200"
                  : "bg-gray-200 text-left border-gray-300"
              }`}
            >
              {/* ⬇️ Textfarbe explizit dunkel erzwingen */}
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {msg.inhalt || "—"}
              </p>
              <p className="text-xs text-gray-600">
                {new Date(msg.zeitpunkt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={senden} className="flex gap-2 items-end">
        <textarea
          ref={inputRef}
          rows={1}
          value={neueNachricht}
          onChange={(e) => setNeueNachricht(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-2 border rounded resize-none"
          placeholder="Nachricht schreiben… (Shift+Enter = Zeilenumbruch)"
          required
          style={{ maxHeight: 200 }}
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={!neueNachricht.trim()}
        >
          Senden
        </button>
      </form>

      {/* DEBUG-BOX */}
      <div className="mt-4 p-3 text-xs border rounded bg-white/70">
        <div><b>Debug</b></div>
        <div>auftragId: <code>{String(auftragId || "—")}</code></div>
        <div>loading: <code>{String(loading)}</code></div>
        <div>last GET status: <code>{String(dbg.lastGetStatus)}</code></div>
        <div>last POST status: <code>{String(dbg.lastPostStatus)}</code></div>
        {dbg.lastError && <div>last error: <code>{dbg.lastError}</code></div>}
        <div>count: <code>{nachrichten.length}</code></div>
        <div className="mt-2">
          letzte 2:
          <pre className="whitespace-pre-wrap">
{JSON.stringify(nachrichten.slice(-2), null, 2)}
          </pre>
        </div>
        <button onClick={ladenNachrichten} className="mt-2 px-2 py-1 border rounded">
          Neu laden
        </button>
      </div>
    </div>
  );
}
