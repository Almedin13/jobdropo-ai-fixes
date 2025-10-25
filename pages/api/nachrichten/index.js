// pages/api/nachrichten/index.js
import clientPromise from "../../../lib/mongodb"; // nutzt deinen bestehenden Connector
import { ObjectId } from "mongodb";

function toObjectId(maybeId) {
  try {
    return new ObjectId(maybeId);
  } catch {
    return null; // falls es kein gültiger ObjectId-String ist
  }
}

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db =
      client.db(process.env.MONGODB_DB || process.env.MONGODB_DB_NAME); // passt zu deiner env
    const col = db.collection("nachrichten");

    if (req.method === "POST") {
      const {
        auftragId,
        angebotId,
        text,
        type = "normal",
        senderId,
        senderEmail,
        recipientEmail,
      } = req.body || {};

      if (!auftragId || !text?.trim()) {
        return res
          .status(400)
          .json({ ok: false, error: "auftragId und text sind erforderlich" });
      }

      const doc = {
        auftragId: toObjectId(auftragId) ?? auftragId,
        ...(angebotId ? { angebotId: toObjectId(angebotId) ?? angebotId } : {}),
        text: text.trim(),
        type, // "normal" | "system"
        ...(senderId ? { senderId: toObjectId(senderId) ?? senderId } : {}),
        ...(senderEmail ? { senderEmail } : {}),
        ...(recipientEmail ? { recipientEmail } : {}),
        createdAt: new Date(),
      };

      const result = await col.insertOne(doc);
      return res
        .status(201)
        .json({ ok: true, item: { _id: result.insertedId, ...doc } });
    }

    if (req.method === "GET") {
      const { auftragId } = req.query || {};
      if (!auftragId) {
        return res
          .status(400)
          .json({ ok: false, error: "auftragId required" });
      }
      const filter = { auftragId: toObjectId(auftragId) ?? auftragId };
      const items = await col.find(filter).sort({ createdAt: 1 }).toArray();
      return res.status(200).json({ ok: true, items });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  } catch (err) {
    console.error("API /nachrichten error:", err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
}
