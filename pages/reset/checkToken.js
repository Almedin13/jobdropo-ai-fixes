// pages/api/user/reset/checkToken.js
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Methode nicht erlaubt" });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token fehlt" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    const eintrag = await db.collection("passwortTokens").findOne({ token });

    if (!eintrag || !eintrag.userId || !eintrag.ablauf || new Date(eintrag.ablauf) < new Date()) {
      return res.status(400).json({ message: "Token ist ungültig oder abgelaufen" });
    }

    return res.status(200).json({ message: "Token gültig" });
  } catch (error) {
    console.error("Fehler beim Prüfen des Tokens:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
}
