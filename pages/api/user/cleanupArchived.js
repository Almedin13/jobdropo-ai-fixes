import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Nur POST-Anfragen erlaubt" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    // 2 Monate zurückrechnen
    const zweiMonateZurueck = new Date();
    zweiMonateZurueck.setMonth(zweiMonateZurueck.getMonth() - 2);

    // Alle archivierten Benutzer finden, deren Archivierung älter als 2 Monate ist
    const zuLoeschende = await db.collection("benutzer").find({
      archiviert: true,
      archiviertAm: { $lte: zweiMonateZurueck }
    }).toArray();

    // IDs der Nutzer sammeln und löschen
    const ids = zuLoeschende.map((b) => b._id);
    if (ids.length > 0) {
      await db.collection("benutzer").deleteMany({ _id: { $in: ids } });
    }

    return res.status(200).json({
      message: `Es wurden ${ids.length} archivierte Konten gelöscht.`,
    });
  } catch (error) {
    console.error("Fehler beim Aufräumen archivierter Konten:", error);
    return res.status(500).json({ message: "Interner Fehler beim Aufräumen" });
  }
}
