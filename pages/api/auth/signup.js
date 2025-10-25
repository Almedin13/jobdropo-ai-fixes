import clientPromise from "../../../lib/mongodb";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Methode nicht erlaubt" });
  }

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    // Prüfen, ob Email schon existiert
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email ist bereits registriert" });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Neuen Nutzer anlegen
    await db.collection("users").insertOne({
      email,
      name,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return res.status(201).json({ message: "Nutzer erfolgreich registriert" });
  } catch (error) {
    console.error("Fehler bei Registrierung:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
}
