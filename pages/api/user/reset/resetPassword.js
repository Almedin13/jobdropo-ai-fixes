// pages/api/user/reset/resetPassword.js
import clientPromise from "../../../../lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Methode nicht erlaubt" });
  }

  const { token, neuesPasswort } = req.body;

  if (!token || !neuesPasswort) {
    return res.status(400).json({ message: "Token oder neues Passwort fehlt" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    const eintrag = await db.collection("passwortTokens").findOne({ token });

    if (!eintrag || new Date(eintrag.ablauf) < new Date()) {
      return res.status(400).json({ message: "Token ist ungültig oder abgelaufen" });
    }

    const hashedPasswort = await bcrypt.hash(neuesPasswort, 10);

    await db.collection("benutzer").updateOne(
      { _id: new ObjectId(eintrag.userId) },
      { $set: { passwort: hashedPasswort } }
    );

    // Token nach Verwendung löschen
    await db.collection("passwortTokens").deleteOne({ token });

    return res.status(200).json({ message: "Passwort wurde erfolgreich geändert" });
  } catch (error) {
    console.error("Fehler beim Zurücksetzen des Passworts:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
}
