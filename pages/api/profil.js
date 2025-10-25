import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("vermittlungsapp");
  const collection = db.collection("nutzer");

  try {
    // ------------------------------------
    // 📦 GET: Profil eines Benutzers abrufen
    // ------------------------------------
    if (req.method === "GET") {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ success: false, message: "E-Mail fehlt" });
      }

      const user = await collection.findOne({ email });

      if (!user) {
        // Kein Profil vorhanden → leeres Objekt zurückgeben
        return res.status(200).json({});
      }

      return res.status(200).json(user);
    }

    // ------------------------------------
    // 💾 POST: Profil speichern / aktualisieren
    // ------------------------------------
    if (req.method === "POST") {
      const data = req.body;

      if (!data?.email) {
        return res.status(400).json({ success: false, message: "Keine E-Mail übergeben" });
      }

      // Kombinierten Namen aus Vor- & Nachname erzeugen (falls vorhanden)
      const fullName = `${data.vorname || ""} ${data.nachname || ""}`.trim();

      const profilDaten = {
        vorname: data.vorname || "",
        nachname: data.nachname || "",
        name: fullName || data.name || "",
        email: data.email,
        telefon: data.telefon || "",
        firma: data.firma || "",
        strasse: data.strasse || "",
        plz: data.plz || "",
        stadt: data.stadt || "",
        iban: data.iban || "",
        bic: data.bic || "",
        updatedAt: new Date(),
      };

      // Existiert der Nutzer bereits?
      const existingUser = await collection.findOne({ email: data.email });

      // Wenn es ein neuer Nutzer ist, setze createdAt
      if (!existingUser) {
        profilDaten.createdAt = new Date();
      }

      const result = await collection.updateOne(
        { email: data.email },
        { $set: profilDaten },
        { upsert: true }
      );

      if (!result.acknowledged) {
        return res
          .status(500)
          .json({ success: false, message: "Speichern fehlgeschlagen" });
      }

      return res
        .status(200)
        .json({ success: true, message: "✅ Profil erfolgreich gespeichert" });
    }

    // ------------------------------------
    // ❌ Ungültige Methode
    // ------------------------------------
    return res.status(405).json({ success: false, message: "Methode nicht erlaubt" });
  } catch (error) {
    console.error("❌ Fehler in /api/profil:", error);
    return res.status(500).json({
      success: false,
      message: "Interner Serverfehler",
      error: error.message,
    });
  }
}
