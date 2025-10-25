import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Nur DELETE-Anfragen erlaubt" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "E-Mail fehlt" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    const result = await db.collection("benutzer").updateOne(
      { email },
      {
        $set: {
          archiviert: true,
          archiviertAm: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    return res.status(200).json({ message: "Konto wurde archiviert und wird später gelöscht." });
  } catch (error) {
    console.error("Fehler beim Archivieren des Kontos:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
}
