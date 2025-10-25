// pages/api/dienstleister/profil.js
import clientPromise from "../../../lib/mongodb"; // deine DB-Verbindung

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db();

  if (req.method === "GET") {
    const { dienstleisterId } = req.query;
    if (!dienstleisterId) return res.status(400).json({ error: "dienstleisterId fehlt" });

    const doc = await db.collection("dienstleisterProfile").findOne({ dienstleisterId });
    return res.status(200).json(doc || {});
  }

  if (req.method === "PUT") {
    const {
      dienstleisterId, name, email, telefon, firma,
      strasse, hausnummer, plz, stadt, iban, bic, ustId
    } = req.body || {};
    if (!dienstleisterId) return res.status(400).json({ error: "dienstleisterId fehlt" });

    const profile = { dienstleisterId, telefon, firma, strasse, hausnummer, plz, stadt, iban, bic, ustId };

    // Profil separat speichern
    await db.collection("dienstleisterProfile").updateOne(
      { dienstleisterId },
      { $set: profile },
      { upsert: true }
    );

    // Optional: Basisdaten im Users-Doc mitschreiben
    if (name || email) {
      await db.collection("users").updateOne(
        { _id: dienstleisterId },
        { $set: { ...(name ? { name } : {}), ...(email ? { email } : {}) } }
      );
    }

    return res.status(200).json(profile);
  }

  return res.status(405).end();
}
