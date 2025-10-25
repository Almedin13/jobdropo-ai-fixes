import clientPromise from "../../../lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Nur PATCH-Anfragen erlaubt" });
  }

  const { email, passwortAlt, passwortNeu } = req.body;

  if (!email || !passwortAlt || !passwortNeu) {
    return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    // Benutzer mit passender E-Mail finden
    const user = await db.collection("benutzer").findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    // Prüfen, ob das alte Passwort korrekt ist
    const stimmt = await bcrypt.compare(passwortAlt, user.passwort);
    if (!stimmt) {
      return res.status(401).json({ message: "Aktuelles Passwort ist falsch" });
    }

    // Neues Passwort hashen
    const hashedNeu = await bcrypt.hash(passwortNeu, 10);

    // Passwort in der DB aktualisieren
    await db.collection("benutzer").updateOne(
      { email },
      { $set: { passwort: hashedNeu } }
    );

    return res.status(200).json({ message: "Passwort erfolgreich geändert" });
  } catch (error) {
    console.error("Fehler beim Passwort-Ändern:", error);
    return res.status(500).json({ message: "Serverfehler beim Ändern des Passworts" });
  }
}
