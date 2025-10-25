import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "E-Mail fehlt" });

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    // Alle Angebote und Nachrichten des Dienstleisters laden
    const angebote = await db.collection("angebote").find({ dienstleisterId: email }).toArray();
    const nachrichten = await db.collection("nachrichten").find({ sender: email }).toArray();

    // Auftrag-IDs sammeln, bei denen der Dienstleister aktiv war
    const aktivierteAuftragIds = new Set();

    angebote.forEach((a) => aktivierteAuftragIds.add(a.auftragId));
    nachrichten.forEach((n) => aktivierteAuftragIds.add(n.auftragId));

    // Gruppierung nach Monat
    const rechnungen = {};
    aktivierteAuftragIds.forEach((auftragId) => {
      const angebot = angebote.find((a) => a.auftragId === auftragId);
      const nachricht = nachrichten.find((n) => n.auftragId === auftragId);

      const datum = angebot?.erstelltAm || nachricht?.gesendetAm;
      if (!datum) return;

      const date = new Date(datum);
      const monat = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (!rechnungen[monat]) rechnungen[monat] = { auftraege: 0 };
      rechnungen[monat].auftraege += 1;
    });

    // Rechnungsdaten berechnen
    const rechnungsliste = Object.entries(rechnungen).map(([monat, info]) => {
      const netto = info.auftraege * 2;
      const mwst = +(netto * 0.19).toFixed(2);
      const brutto = +(netto + mwst).toFixed(2);

      return {
        monat,
        anzahl: info.auftraege,
        netto,
        mwst,
        brutto,
      };
    });

    res.status(200).json({ rechnungen: rechnungsliste });
  } catch (error) {
    console.error("Fehler bei Rechnungsabruf:", error);
    res.status(500).json({ message: "Interner Serverfehler" });
  }
}
