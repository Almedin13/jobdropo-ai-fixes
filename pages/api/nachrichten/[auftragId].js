import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  const { auftragId } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    if (req.method === "GET") {
      const nachrichten = await db
        .collection("nachrichten")
        .find({ auftragId })
        .sort({ zeitpunkt: 1 })
        .toArray();
      return res.status(200).json(nachrichten);
    }

    if (req.method === "POST") {
      const { von, an, inhalt } = req.body;
      if (!inhalt || !von || !an) {
        return res.status(400).json({ message: "Fehlende Felder" });
      }

      const neueNachricht = {
        auftragId,
        von,
        an,
        inhalt,
        zeitpunkt: new Date(),
      };

      await db.collection("nachrichten").insertOne(neueNachricht);
      return res.status(201).json({ message: "Nachricht gespeichert" });
    }

    res.status(405).json({ message: "Methode nicht erlaubt" });
  } catch (error) {
    console.error("Fehler bei Nachrichten-API:", error);
    res.status(500).json({ message: "Fehler beim Nachrichtenabruf" });
  }
}
