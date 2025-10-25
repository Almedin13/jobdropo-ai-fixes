import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router";
import Link from "next/link";

export default function MeineAngebote() {
  const { user } = useUser();
  const router = useRouter();
  const [angebote, setAngebote] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAngebote = async () => {
      try {
        const res = await fetch(`/api/angebote?dienstleisterId=${user._id}`);
        const data = await res.json();
        setAngebote(data);
      } catch (error) {
        console.error("Fehler beim Laden der Angebote:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAngebote();
  }, [user]);

  if (!user) return <p className="p-4">Bitte einloggen...</p>;
  if (loading) return <p className="p-4">Lade Angebote...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Meine Angebote</h1>

      {angebote.length === 0 ? (
        <p className="text-gray-500">Du hast noch keine Angebote abgegeben.</p>
      ) : (
        <div className="grid gap-4">
          {angebote.map((a) => (
            <div key={a._id} className="border p-4 rounded shadow">
              <h2 className="text-lg font-semibold">{a.auftrag?.titel || "Unbekannter Auftrag"}</h2>
              <p className="text-sm text-gray-600 mb-2">{a.auftrag?.beschreibung?.slice(0, 100)}...</p>
              <p className="text-sm mb-1">Dein Preis: <strong>{a.preis} €</strong></p>
              <p className="text-sm mb-1">Kommentar: {a.kommentar || "–"}</p>
              <Link href={`/dienstleister/auftrag/${a.auftragId}`} className="text-blue-600 hover:underline">
                Zum Auftrag
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
