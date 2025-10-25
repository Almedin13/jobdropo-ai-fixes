import clientPromise from "../../lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Nur POST-Anfragen erlaubt" });
  }

  const { email, passwort, rolle } = req.body;

  if (!email || !passwort || !rolle) {
    return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    // Wichtig: gleiche Collection wie bei Registrierung
    const user = await db
      .collection("benutzer") // 👈 angepasst von "users" auf "benutzer"
      .findOne({ email, rolle: rolle.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Benutzer nicht gefunden oder falsche Rolle" });
    }

    const passwortStimmt = await bcrypt.compare(passwort, user.passwort);

    if (!passwortStimmt) {
      return res.status(401).json({ message: "Falsches Passwort" });
    }

    const { passwort: _, ...userOhnePasswort } = user;

    return res.status(200).json({
      message: "Login erfolgreich",
      user: userOhnePasswort,
    });
  } catch (error) {
    console.error("Fehler beim Login:", error);
    return res.status(500).json({ message: "Serverfehler beim Login" });
  }
}
