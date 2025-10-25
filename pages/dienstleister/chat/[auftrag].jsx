// pages/dienstleister/chat/[auftragId].jsx
import { useRouter } from "next/router";
import { useState, useEffect, useMemo, useRef } from "react";
import { useUser } from "../../../context/UserContext";
import DienstleisterLayout from "../../../components/layouts/DienstleisterLayout";

export default function ChatThreadSeite() {
  const router = useRouter();
  const { user } = useUser();

  // URL-Param: /dienstleister/chat/[auftragId]
  const auftragParam = router.query.auftragId;
  const auftragId = useMemo(
    () => (Array.isArray(auftragParam) ? auftragParam[0] : auftragParam),
    [auftragParam]
  );

  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [nachrichten, setNachrichten] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);
  const pollRef = useRef(null);

  // Vereinheitlicht API-Feldnamen
  const normalizeMsg = (m) => {
    const inhalt =
      m?.inhalt ?? m?.text ?? m?.message ?? m?.content ?? m?.msg ?? "";
    const zeitRaw =
      m?.zeitpunkt ?? m?.createdAt ?? m?.created_at ?? m?.date ?? m?.timestamp;
    const zeitpunkt = zeitRaw
      ? new Date(zeitRaw).toISOString()
      : new Date().toISOString();
    const von = m?.von ?? m?.senderRole ?? m?.senderType ?? m?.sender ?? m?.from ?? "system";
    const an = m?.an ?? m?.receiverRole ?? m?.empfaenger ?? m?.to ?? undefined;
    return { von, an, inhalt, zeitpunkt };
  };

  // Zugriff absichern
  useEffect(() => {
    if (!router.isReady) return;
    if (user === null) router.push("/login");
    else if (user !== undefined && user?.rolle !== "dienstleister") router.push("/dashboard");
  }, [router.isReady, user, router]);

  // Verlauf laden (no-cache) + Polling
  const laden = async () => {
    if (!auftragId) return;
    const url = `/api/nachrichten/${auftragId}?t=${Date.now()}`;
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const raw = res.ok ? await res.json() : [];
      const arr = (Array.isArray(raw) ? raw : (raw?.nachrichten || raw?.messages || raw?.data || []))
        .map(normalizeMsg)
        .sort((a, b) => new Date(a.zeitpunkt) - new Date(b.zeitpunkt)); // alt → neu
      setNachrichten(arr);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady || !auftragId) return;
    laden();
    pollRef.current = setInterval(laden, 5000);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [router.isReady, auftragId]);

  // Immer nach unten scrollen
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [nachrichten.length]);

  // Nachricht senden (optimistisch) + Polling kurz pausieren
  const handleNachrichtSenden = async () => {
    const trimmed = text.trim();
    if (!trimmed) { setFeedback("❌ Bitte Text eingeben."); return; }
    if (!auftragId) { setFeedback("❌ Keine Auftrags-ID gefunden."); return; }

    const optimistic = {
      von: "dienstleister",
      an: "auftraggeber",
      inhalt: trimmed,
      zeitpunkt: new Date().toISOString(),
      _optimistic: true,
    };
    setNachrichten((prev) => [...prev, optimistic]);
    setText("");

    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }

    try {
      const res = await fetch(`/api/nachrichten/${auftragId}?t=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({ von: "dienstleister", an: "auftraggeber", inhalt: trimmed }),
      });

      if (!res.ok) throw new Error("send_failed");

      setFeedback("✅ Nachricht gesendet");
      await laden(); // echte Daten nachziehen
    } catch (error) {
      console.error(error);
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

  if (!user) return <p className="p-8">Lade...</p>;

  return (
    <DienstleisterLayout active="nachrichten">
      <div className="p-8 max-w-2xl">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/dienstleister/nachrichten")}
            className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300"
          >
            ← Zur Übersicht
          </button>
          <h1 className="text-xl font-bold">💬 Nachrichten zu Auftrag #{auftragId || "—"}</h1>
        </div>

        {/* Verlauf */}
        <div
          ref={listRef}
          className="border rounded p-4 h-96 overflow-y-auto mb-4 bg-gray-50"
        >
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

        {/* Eingabe */}
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
    </DienstleisterLayout>
  );
}
