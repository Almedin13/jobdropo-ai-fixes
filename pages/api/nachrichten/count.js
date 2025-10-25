// pages/api/nachrichten/count.js
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

function toDateOrNull(v) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "vermittlungsapp");
    const nachrichtenCol = db.collection("nachrichten");
    const auftraegeCol = db.collection("auftraege");

    // ownerEmail = E-Mail des Auftraggebers (Ersteller der Aufträge)
    // since = optional ISO-Zeitstempel für "neue" Nachrichten seit ...
    const { ownerEmail, since } = req.query || {};
    if (!ownerEmail) {
      return res.status(400).json({ ok: false, error: "ownerEmail required" });
    }

    // Alle Aufträge dieses Auftraggebers holen (nur IDs)
    const auftraege = await auftraegeCol
      .find({ erstelltVon: ownerEmail })
      .project({ _id: 1 })
      .toArray();

    if (!auftraege.length) {
      return res.status(200).json({ ok: true, count: 0 });
    }

    const idsObj = auftraege.map(a => a._id);
    const idsStr = idsObj.map(id => String(id));

    // Nachrichten-Filter:
    const orOnId = [
      { auftragId: { $in: idsObj } },      // falls als ObjectId gespeichert
      { auftragId: { $in: idsStr } },      // falls als String gespeichert
    ];

    const filter = { $or: orOnId };

    // Nur "neue" Nachrichten seit Zeitpunkt (optional)
    const sinceDate = since ? toDateOrNull(since) : null;
    if (sinceDate) filter.createdAt = { $gt: sinceDate };

    // Optional (wenn senderEmail gesetzt ist): keine eigenen Nachrichten zählen
    // Falls senderEmail in alten Nachrichten fehlt, zählen wir sie trotzdem.
    filter.$and = [
      {
        $or: [
          { senderEmail: { $exists: false } },
          { senderEmail: { $ne: ownerEmail } },
        ],
      },
    ];

    const count = await nachrichtenCol.countDocuments(filter);
    return res.status(200).json({ ok: true, count });
  } catch (err) {
    console.error("GET /api/nachrichten/count error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
}
