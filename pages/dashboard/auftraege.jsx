import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AuftraggeberLayout from "../../components/layouts/AuftraggeberLayout";
import { useUser } from "../../context/UserContext";

export default function Auftraege() {
  const { user } = useUser();
  const router = useRouter();
  const [auftraege, setAuftraege] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔒 Zugriffsschutz
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user !== undefined && user.rolle !== "auftraggeber") {
      router.push("/dienstleister/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const res = await fetch("/api/auftraege?userEmail=" + encodeURIComponent(user.email));
        const data = await res.json();
        setAuftraege(data);
      } catch (error) {
        console.error("Fehler beim Laden der Aufträge:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (!user) return <p className="text-center mt-10">Bitte einloggen...</p>;

  return (
    <AuftraggeberLayout>
      <h1 className="text-2xl font-bold mb-4">Meine Aufträge</h1>
      {loading ? (
        <p>Lade Aufträge...</p>
      ) : auftraege.length === 0 ? (
        <p>Keine Aufträge vorhanden.</p>
      ) : (
        <ul className="space-y-4">
          {auftraege.map((auftrag) => (
            <li key={auftrag._id} className="p-4 border rounded shadow bg-white">
              <h2 className="text-xl font-semibold">
                <Link
                  href={`/auftrag/${auftrag._id}`}
                  className="text-blue-600 hover:underline"
                >
                  {auftrag.titel || "Kein Titel"}
                </Link>
              </h2>
              <p>{auftrag.beschreibung || "Keine Beschreibung vorhanden."}</p>
              <p className="text-sm text-gray-600 mt-2">
                Status: <strong>{auftrag.status}</strong> – Erstellt am:{" "}
                {new Date(auftrag.erstelltAm).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AuftraggeberLayout>
  );
}
