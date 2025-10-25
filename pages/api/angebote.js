import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb"; // ✅ Import hinzugefügt

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("vermittlungsapp");

  if (req.method === "POST") {
    const { auftragId, text, dienstleisterId, erstelltVon, erstelltAm, status } = req.body;

    if (!auftragId || !dienstleisterId || !erstelltVon || !text) {
      return res.status(400).json({ message: "Fehlende Angaben im Angebot" });
    }

    try {
      await db.collection("angebote").insertOne({
        auftragId,
        text,
        dienstleisterId,
        erstelltVon,
        erstelltAm: erstelltAm || new Date().toISOString(),
        status: status || "offen",
      });

      return res.status(201).json({ message: "Angebot gespeichert" });
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      return res.status(500).json({ message: "Fehler beim Speichern des Angebots" });
    }
  }

  if (req.method === "GET") {
    const { dienstleisterId, email } = req.query;

    if (!dienstleisterId && !email) {
      return res.status(400).json({ message: "dienstleisterId oder email fehlt" });
    }

    try {
      const angebote = await db
        .collection("angebote")
        .find(
          dienstleisterId
            ? { dienstleisterId }
            : { erstelltVon: email }
        )
        .sort({ erstelltAm: -1 })
        .toArray();

      const auftragIds = angebote.map((a) => a.auftragId);
      const auftraege = await db
        .collection("auftraege")
        .find({ _id: { $in: auftragIds.map((id) => new ObjectId(id)) } }) // ✅ Fix hier
        .toArray();

      const auftragMap = Object.fromEntries(
        auftraege.map((a) => [a._id.toString(), a])
      );

      const angeboteMitAuftrag = angebote.map((a) => ({
        ...a,
        auftrag: auftragMap[a.auftragId] || null,
      }));

      return res.status(200).json(angeboteMitAuftrag);
    } catch (error) {
      console.error("Fehler beim Laden der Angebote:", error);
      return res.status(500).json({ message: "Fehler beim Abruf" });
    }
  }

  return res.status(405).json({ message: "Methode nicht erlaubt" });
}
