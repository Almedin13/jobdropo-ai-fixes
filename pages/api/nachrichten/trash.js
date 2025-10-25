// pages/api/nachrichten/trash.js
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

const toOid = (v) => (ObjectId.isValid(v) ? new ObjectId(v) : null);
const asStr = (v) => (v == null ? undefined : String(v));

const buildFilter = ({ threadId, auftragId }) => {
  const or = [];
  if (threadId) {
    const s = asStr(threadId), o = toOid(threadId);
    or.push({ _id: s }); if (o) or.push({ _id: o });
    or.push({ threadId: s }); if (o) or.push({ threadId: o });
    or.push({ conversationId: s }); if (o) or.push({ conversationId: o });
  }
  if (auftragId) {
    const s = asStr(auftragId), o = toOid(auftragId);
    or.push({ auftragId: s }); if (o) or.push({ auftragId: o });
    or.push({ orderId: s }); if (o) or.push({ orderId: o });
    or.push({ jobId: s }); if (o) or.push({ jobId: o });
  }
  return or.length ? { $or: or } : {};
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Nur POST" });
  try {
    const { threadId, auftragId } = req.body || {};
    if (!threadId && !auftragId) {
      return res.status(400).json({ error: "threadId ODER auftragId nötig" });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const filter = buildFilter({ threadId, auftragId });
    // In den Papierkorb: löschen markieren + sicherstellen, dass nicht (mehr) archiviert
    const update = { $set: { deleted: true, deletedAt: new Date(), archiviert: false } };

    const results = {};

    // Threads-Collection (bei dir i. d. R. "nachrichten")
    const colThreads = db.collection("nachrichten");
    const r1 = await colThreads.updateMany(filter, update);
    results.threads = { matched: r1.matchedCount, modified: r1.modifiedCount };

    // Messages-Collection (falls vorhanden)
    try {
      const colMsgs = db.collection("messages");
      const r2 = await colMsgs.updateMany(filter, update);
      results.messages = { matched: r2.matchedCount, modified: r2.modifiedCount };
    } catch {
      results.messages = { matched: 0, modified: 0 };
    }

    return res.status(200).json({ ok: true, ...results });
  } catch (e) {
    console.error("Trash failed:", e);
    return res.status(500).json({ error: "Trash failed" });
  }
}
