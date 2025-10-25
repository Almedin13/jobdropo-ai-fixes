// pages/api/auftraege.js
import clientPromise from "../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("vermittlungsapp");

  // ---------------- POST (Auftrag erstellen) ----------------
  if (req.method === "POST") {
    try {
      const auftrag = req.body;

      if (!auftrag || !auftrag.erstelltVon) {
        return res.status(400).json({ message: "Benutzer-Email fehlt" });
      }

      const telefon = auftrag.telefon || auftrag.auftraggeber?.telefon || "";

      await db.collection("auftraege").insertOne({
        ...auftrag,
        telefon,
        erstelltAm: new Date(),
        status: "offen",
      });

      return res.status(201).json({ message: "Auftrag erfolgreich erstellt" });
    } catch (error) {
      console.error("Fehler bei Auftragserstellung:", error);
      return res.status(500).json({ message: "Interner Serverfehler" });
    }
  }

  // ---------------- GET (Aufträge abrufen) ----------------
  if (req.method === "GET") {
    try {
      const { userEmail, status } = req.query; // 🔹 jetzt status statt mine
      const auftraegeCollection = db.collection("auftraege");
      const usersCollection = db.collection("users");

      let filter = {};

      // 🔹 Filter nach Status (z. B. ?status=angenommen)
      if (status) {
        filter.status = status;
      }

      // 🔹 Filter nach Auftraggeber (z. B. ?userEmail=test@mail.com)
      if (userEmail) {
        filter.erstelltVon = userEmail;
      }

      const auftraege = await auftraegeCollection.find(filter).toArray();

      // 🔄 Kundendaten ergänzen
      const erstellendeEmails = auftraege.map(a => a.erstelltVon).filter(Boolean);
      const userDocs = await usersCollection
        .find({ email: { $in: erstellendeEmails } })
        .project({ email: 1, vorname: 1, nachname: 1 })
        .toArray();

      // Map für schnellen Zugriff
      const userMap = {};
      userDocs.forEach(u => {
        userMap[u.email] = {
          kundeVorname: u.vorname || "",
          kundeNachname: u.nachname || "",
        };
      });

      // 🔗 Kundennamen in Aufträge einfügen
      const result = auftraege.map(a => ({
        ...a,
        ...userMap[a.erstelltVon],
      }));

      return res.status(200).json(result);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
      return res.status(500).json({ message: "Fehler beim Laden" });
    }
  }

  // ---------------- PATCH (Status aktualisieren) ----------------
  if (req.method === "PATCH") {
    try {
      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ message: "ID oder Status fehlt" });
      }

      const result = await db.collection("auftraege").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status } }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "Auftrag nicht gefunden oder unverändert" });
      }

      return res.status(200).json({ message: "Status aktualisiert" });
    } catch (error) {
      console.error("Fehler beim PATCH:", error);
      return res.status(500).json({ message: "Fehler beim Status-Update" });
    }
  }

  return res.status(405).json({ message: "Methode nicht erlaubt" });
}
