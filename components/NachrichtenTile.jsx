// components/NachrichtenTile.jsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function NachrichtenTile({ ownerEmail }) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const STORAGE_KEY = "lastSeenMessagesAt";

  useEffect(() => {
    if (!ownerEmail) return;
    let mounted = true;

    function getSince() {
      const s = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (s) return s;
      const now = new Date().toISOString();
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, now);
      return now;
    }

    async function fetchCount() {
      setLoading(true);
      try {
        const since = getSince();
        const url = `/api/nachrichten/count?ownerEmail=${encodeURIComponent(
          ownerEmail
        )}&since=${encodeURIComponent(since)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!mounted) return;
        setCount(data?.ok ? data.count ?? 0 : 0);
      } catch {
        if (mounted) setCount(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCount();
    const t = setInterval(fetchCount, 15000); // alle 15s prüfen
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [ownerEmail]);

  function handleOpen() {
    // „gesehen“-Zeitpunkt setzen, Badge zurücksetzen und zur Nachrichten-Seite
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    setCount(0);
    router.push("/dashboard/nachrichten");
  }

  return (
    <button
      onClick={handleOpen}
      className="w-full bg-white rounded-lg p-4 shadow hover:shadow-md transition text-left"
      title="Zu Nachrichten"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Nachrichten</div>
        {count > 0 && (
          <span className="inline-flex items-center justify-center text-xs font-semibold px-2 py-0.5 rounded-full bg-red-600 text-white">
            {count}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">
        {loading ? "…" : count > 0 ? `${count} neu` : "Keine neuen"}
      </div>
      <div className="text-sm text-gray-500 mt-1">Klicken zum Öffnen</div>
    </button>
  );
}
