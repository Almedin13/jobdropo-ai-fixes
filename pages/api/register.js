// pages/api/register.js
import clientPromise from "../../lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Nur POST-Anfragen erlaubt" });
  }

  const { name, email, passwort, rolle } = req.body;

  if (!name || !email || !passwort || !rolle) {
    return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    const bestehenderUser = await db
      .collection("benutzer")
      .findOne({ email, rolle: rolle.toLowerCase() });

    if (bestehenderUser) {
      return res.status(409).json({ message: "Benutzer mit dieser E-Mail existiert bereits" });
    }

    const passwortHash = await bcrypt.hash(passwort, 10);

    const neuerUser = {
      name,
      email,
      passwort: passwortHash,
      rolle: rolle.toLowerCase(),
      erstelltAm: new Date(),
    };

    const result = await db.collection("benutzer").insertOne(neuerUser);

    const { passwort: _, ...userOhnePasswort } = neuerUser;

    return res.status(201).json({
      message: "Registrierung erfolgreich",
      user: userOhnePasswort,
    });
  } catch (error) {
    console.error("Fehler bei Registrierung:", error);
    return res.status(500).json({ message: "Fehler beim Speichern in der Datenbank" });
  }
}
