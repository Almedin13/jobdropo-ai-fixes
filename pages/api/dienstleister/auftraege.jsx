// pages/api/dienstleister/auftraege.jsx
import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    if (req.method === "GET") {
      const { mine, email } = req.query;
      let filter = {};

      // Wenn Dienstleister seine eigenen Aufträge sehen will
      if (mine && email) {
        filter = { "dienstleister.email": email };
      }

      const auftraege = await db
        .collection("auftraege")
        .find(filter)
        .sort({ erstelltAm: -1 })
        .toArray();

      res.status(200).json(auftraege);
    } else if (req.method === "POST") {
      const body = req.body;

      if (!body.titel || !body.ort) {
        return res.status(400).json({ message: "Titel und Ort sind erforderlich" });
      }

      const newAuftrag = {
        titel: body.titel,
        beschreibung: body.beschreibung || "",
        ort: body.ort,
        plz: body.plz || "",
        strasse: body.strasse || "",
        preis: body.preis || null,
        status: body.status || "offen",
        erstelltAm: new Date(),
      };

      const result = await db.collection("auftraege").insertOne(newAuftrag);
      res.status(201).json(result);
    } else {
      res.status(405).json({ message: "Methode nicht erlaubt" });
    }
  } catch (err) {
    console.error("Fehler in /api/dienstleister/auftraege:", err);
    res.status(500).json({ message: "Interner Serverfehler", error: err.message });
  }
}
