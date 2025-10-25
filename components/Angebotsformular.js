import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "../context/UserContext";

export default function Angebotsformular({ auftragId, auftragstitel, vorhandenesAngebot }) {
  const router = useRouter();
  const { user } = useUser();

  const [preis, setPreis] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [status, setStatus] = useState("offen");
  const [feedback, setFeedback] = useState("");
  const [preisArt, setPreisArt] = useState("stundenweise");
  const [nettoOderBrutto, setNettoOderBrutto] = useState("");

  const [anzeigeModus, setAnzeigeModus] = useState(null); // "angebot", "nachricht", "ablehnen"
  const [ablehnGrund, setAblehnGrund] = useState("");
  const [freitextGrund, setFreitextGrund] = useState("");

  // Beim ersten Laden automatisch aus vorhandenesAngebot oder router.query befüllen
  useEffect(() => {
    const { preis, nachricht, preisart, nettoOderBrutto: queryNettoBrutto } = router.query;

    setPreis(vorhandenesAngebot?.preis || preis || "");
    setNachricht(vorhandenesAngebot?.text || nachricht || "");
    setStatus(vorhandenesAngebot?.status || "offen");
    setPreisArt(vorhandenesAngebot?.preisArt || preisart || "stundenweise");
    setNettoOderBrutto(vorhandenesAngebot?.nettoOderBrutto || queryNettoBrutto || "");
  }, [vorhandenesAngebot, router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!preis || !nachricht || !nettoOderBrutto) {
      setFeedback("Bitte alle Pflichtfelder ausfüllen (inkl. Netto/Brutto).");
      return;
    }

    const payload = {
      auftragId,
      text: nachricht,
      dienstleisterId: user._id,
      dienstleisterEmail: user.email,
      erstelltVon: user.name,
      status,
      preis: parseFloat(preis),
      preisArt,
      nettoOderBrutto,
      titel: `Angebot zu: ${auftragstitel || "Unbekannter Auftrag"}`
    };

    try {
      const res = await fetch(
        vorhandenesAngebot ? `/api/angebote/${vorhandenesAngebot._id}` : "/api/angebote",
        {
          method: vorhandenesAngebot ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Fehler beim Speichern des Angebots");

      setFeedback("Angebot erfolgreich " + (vorhandenesAngebot ? "aktualisiert" : "erstellt") + ".");
      setTimeout(() => router.push("/dienstleister/angebote"), 1000);
    } catch (err) {
      console.error("❌ Fehler:", err);
      setFeedback("Fehler: " + err.message);
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex gap-4 mb-6">
        <button onClick={() => alert("✅ Auftrag angenommen (Demo)")} className="bg-green-600 text-white px-4 py-2 rounded">✔ Auftrag annehmen</button>
        <button onClick={() => setAnzeigeModus("ablehnen")} className="bg-red-600 text-white px-4 py-2 rounded">❌ Auftrag ablehnen</button>
        <button onClick={() => setAnzeigeModus("nachricht")} className="bg-yellow-500 text-white px-4 py-2 rounded">✉ Nachricht schreiben</button>
        <button onClick={() => setAnzeigeModus("angebot")} className="bg-blue-600 text-white px-4 py-2 rounded">💶 Angebot abgeben</button>
      </div>

      {anzeigeModus === "angebot" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">💶 Dein Preis (€)</label>
            <input
              type="number"
              step="0.01"
              className="border p-2 w-full rounded"
              value={preis}
              onChange={(e) => setPreis(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium">Preisart</label>
            <select
              className="border p-2 w-full rounded"
              value={preisArt}
              onChange={(e) => setPreisArt(e.target.value)}
            >
              <option value="stundenweise">Stundenbasis</option>
              <option value="pauschal">Pauschal</option>
            </select>
          </div>

          <div>
            <label className="block font-medium">Netto oder Brutto</label>
            <div className="flex gap-4">
              <label>
                <input
                  type="radio"
                  value="netto"
                  checked={nettoOderBrutto === "netto"}
                  onChange={(e) => setNettoOderBrutto(e.target.value)}
                /> Netto
              </label>
              <label>
                <input
                  type="radio"
                  value="brutto"
                  checked={nettoOderBrutto === "brutto"}
                  onChange={(e) => setNettoOderBrutto(e.target.value)}
                /> Brutto
              </label>
            </div>
          </div>

          <div>
            <label className="block font-medium">💬 Nachricht</label>
            <textarea
              className="border p-2 w-full rounded"
              value={nachricht}
              onChange={(e) => setNachricht(e.target.value)}
            />
          </div>

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {vorhandenesAngebot ? "Angebot aktualisieren" : "Angebot absenden"}
          </button>

          {feedback && <p className="text-sm text-gray-600">{feedback}</p>}
        </form>
      )}

      {anzeigeModus === "nachricht" && (
        <div className="space-y-2">
          <textarea
            className="w-full border rounded p-2"
            placeholder="Nachricht schreiben..."
          ></textarea>
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Absenden</button>
        </div>
      )}

      {anzeigeModus === "ablehnen" && (
        <div className="space-y-4">
          <label className="block font-medium">Grund der Ablehnung</label>
          <select
            className="border p-2 w-full rounded"
            value={ablehnGrund}
            onChange={(e) => setAblehnGrund(e.target.value)}
          >
            <option value="">-- Grund wählen --</option>
            <option value="zu_weit">Zu weit entfernt</option>
            <option value="zu_wenig">Vergütung zu gering</option>
            <option value="andere">Andere Gründe</option>
          </select>

          <textarea
            className="w-full border rounded p-2"
            placeholder="(Optional) Weitere Angaben"
            value={freitextGrund}
            onChange={(e) => setFreitextGrund(e.target.value)}
          ></textarea>

          <button
            onClick={() => alert("Ablehnung gespeichert (Demo)")}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Ablehnung absenden
          </button>
        </div>
      )}
    </div>
  );
}
