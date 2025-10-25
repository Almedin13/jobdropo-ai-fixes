import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router"; // ✅ Import ergänzt
import DienstleisterLayout from "../../components/layouts/DienstleisterLayout";

export default function Rechnungen() {
  const { user } = useUser();
  const router = useRouter(); // ✅ router hinzufügen
  const [rechnungen, setRechnungen] = useState([]);

  // ⛔ Zugriffsschutz
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user !== undefined && user.rolle !== "dienstleister") {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <DienstleisterLayout active="rechnungen">
      <h1 className="text-2xl font-bold mb-4">Meine Rechnungen</h1>
      {rechnungen.length === 0 ? (
        <p>Keine Rechnungen verfügbar.</p>
      ) : (
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Monat</th>
              <th className="p-2 border">Anzahl Aufträge</th>
              <th className="p-2 border">Netto</th>
              <th className="p-2 border">MwSt (19%)</th>
              <th className="p-2 border">Gesamt (Brutto)</th>
              <th className="p-2 border">PDF</th>
            </tr>
          </thead>
          <tbody>
            {rechnungen.map((r) => (
              <tr key={r.monat} className="text-center">
                <td className="p-2 border">{r.monat}</td>
                <td className="p-2 border">{r.anzahl}</td>
                <td className="p-2 border">{r.netto.toFixed(2)} €</td>
                <td className="p-2 border">{r.mwst.toFixed(2)} €</td>
                <td className="p-2 border font-semibold">{r.brutto.toFixed(2)} €</td>
                <td className="p-2 border">
                  <a
                    href={`/api/rechnungen/${r.monat.replace(".", "-")}?email=${encodeURIComponent(user.email)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    PDF herunterladen
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DienstleisterLayout>
  );
}
