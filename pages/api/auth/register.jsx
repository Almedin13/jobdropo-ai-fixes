import clientPromise from "../../lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Methode nicht erlaubt" });
  }

  const { name, email, passwort, rolle } = req.body;

  if (!name || !email || !passwort || !rolle) {
    return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    // Prüfen, ob Benutzer schon existiert
    const existingUser = await db.collection("benutzer").findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Benutzer existiert bereits" });
    }

    // Passwort hashen
    const hashedPasswort = await bcrypt.hash(passwort, 10);

    // Neuen Benutzer speichern mit gehashtem Passwort & lowercase-Rolle
    await db.collection("benutzer").insertOne({
      name,
      email,
      passwort: hashedPasswort,
      rolle: rolle.toLowerCase(), // 👈 angepasst
      createdAt: new Date(),
    });

    return res.status(201).json({ message: "Benutzer erfolgreich registriert" });
  } catch (error) {
    console.error("Fehler bei Registrierung:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
}
