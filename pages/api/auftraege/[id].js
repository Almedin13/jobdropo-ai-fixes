// pages/api/auftraege/[id].js
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const { id } = req.query;

  const isObjId = (v) => typeof v === "string" && ObjectId.isValid(v);
  const toObjId = (v) => (isObjId(v) ? new ObjectId(v) : null);

  let client, db;
  try {
    client = await clientPromise;
    db = client.db(process.env.MONGODB_DB);
  } catch (e) {
    console.error("DB connect failed", e);
    return res.status(500).json({ error: "DB-Verbindung fehlgeschlagen" });
  }

  const auftraegeCol = db.collection("auftraege");
  const threadsCol = db.collection("nachrichten"); // 👈 bitte sicherstellen, dass deine Threads-Collection so heißt

  // --------- GET (Auftrag laden) ----------
  if (req.method === "GET") {
    try {
      const key = toObjId(id);
      const filter = key ? { $or: [{ _id: key }, { _id: id }] } : { _id: id };

      const auftrag = await auftraegeCol.findOne(filter);
      if (!auftrag) return res.status(404).json({ error: "Auftrag nicht gefunden" });

      return res.status(200).json({
        ...auftrag,
        item: auftrag,
      });
    } catch (err) {
      console.error("GET /api/auftraege/[id] error:", err);
      return res.status(500).json({ error: "Serverfehler" });
    }
  }

  // --------- PATCH/PUT (Status ändern) ----------
  if (req.method === "PATCH" || req.method === "PUT") {
    try {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body || "{}");
        } catch {
          body = {};
        }
      }

      let desired = body?.status ?? null;
      if (typeof desired === "string") desired = desired.trim();
      if (!desired) {
        return res.status(400).json({ ok: false, error: "Missing status" });
      }

      const key = toObjId(id);
      const filter = key ? { $or: [{ _id: key }, { _id: id }] } : { _id: id };

      const result = await auftraegeCol.updateOne(filter, {
        $set: { status: desired, aktualisiertAm: new Date() },
      });

      if (!result.matchedCount) {
        return res.status(404).json({ ok: false, error: "Auftrag nicht gefunden" });
      }

      return res.status(200).json({
        ok: true,
        status: desired,
        item: { _id: id, status: desired },
      });
    } catch (e) {
      console.error("PATCH/PUT /api/auftraege/[id] error:", e);
      return res.status(500).json({ ok: false, error: "Serverfehler beim Status-Update" });
    }
  }

  // --------- DELETE (Auftrag + Nachrichten löschen) ----------
  if (req.method === "DELETE") {
    try {
      const key = toObjId(id);
      const filter = key ? { $or: [{ _id: key }, { _id: id }] } : { _id: id };

      // Auftrag löschen
      const result = await auftraegeCol.deleteOne(filter);
      if (!result.deletedCount) {
        return res.status(404).json({ ok: false, error: "Auftrag nicht gefunden" });
      }

      // Nachrichten-Threads löschen
      const deleteThreads = await threadsCol.deleteMany({ auftragId: id });
      console.log(`DELETE /api/auftraege/${id}: ${deleteThreads.deletedCount} Threads entfernt`);

      return res.status(200).json({
        ok: true,
        deletedAuftrag: id,
        deletedThreads: deleteThreads.deletedCount,
      });
    } catch (e) {
      console.error("DELETE /api/auftraege/[id] error:", e);
      return res.status(500).json({ ok: false, error: "Serverfehler beim Löschen" });
    }
  }

  // --------- andere Methoden ----------
  res.setHeader("Allow", ["GET", "PATCH", "PUT", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
