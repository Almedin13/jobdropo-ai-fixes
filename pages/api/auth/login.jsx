// pages/api/login.js
import clientPromise from "../../lib/mongodb";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Methode nicht erlaubt" });
  }

  const { email, passwort, rolle } = req.body;

  if (!email || !passwort || !rolle) {
    return res.status(400).json({ message: "Bitte alle Felder ausfüllen" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");
   const user = await db.collection("benutzer").findOne({ email });

if (!user) {
  return res.status(401).json({ message: "Benutzer nicht gefunden" });
}

if (user.rolle.toLowerCase() !== rolle.toLowerCase()) {
  return res.status(401).json({ message: "Rolle stimmt nicht überein" });
}


    const passwortOK = await bcrypt.compare(passwort, user.passwort);
    if (!passwortOK) {
      return res.status(401).json({ message: "Falsches Passwort" });
    }

    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      rolle: user.rolle,
    };

    return res.status(200).json({ message: "Login erfolgreich", user: userData });
  } catch (error) {
    console.error("Login Fehler:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
}
