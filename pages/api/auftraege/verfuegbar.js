import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Nur GET-Anfragen erlaubt" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    const auftraege = await db
      .collection("auftraege")
      .find({ status: "offen" }) // nur offene Aufträge anzeigen
      .sort({ erstelltAm: -1 })
      .toArray();

    res.status(200).json(auftraege);
  } catch (error) {
    console.error("Fehler beim Abrufen der Aufträge:", error);
    res.status(500).json({ message: "Fehler beim Laden der Aufträge" });
  }
}
