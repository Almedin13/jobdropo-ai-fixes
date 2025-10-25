// pages/api/nachrichten/threads.js
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Liefert Konversations-Threads für einen Dienstleister.
 * Akzeptierte Query-Parameter (alle optional):
 *  - email
 *  - dienstleisterId
 *  - userId
 *  - archiviert: "0" | "1" (Default: "0" => nur aktive)
 *
 * Gibt NIEMALS 400 zurück, sondern bei fehlendem Treffer einfach [] mit 200.
 * Versucht mehrere Feldnamen (participants, participantEmails, participantIds, dlEmail, dlId ...)
 * Damit ist das Frontend robust gegen unterschiedliche DB-Schemata.
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Nur GET erlaubt" });
  }

  const { email, dienstleisterId, userId, archiviert } = req.query;

  const archFlag =
    String(archiviert ?? "0") === "1" || String(archiviert ?? "0").toLowerCase() === "true"
      ? true
      : false;

  let client, db;
  try {
    client = await clientPromise;
    db = client.db(process.env.MONGODB_DB);
  } catch (e) {
    console.error("DB connect failed:", e);
    return res.status(500).json({ error: "DB-Verbindung fehlgeschlagen" });
  }

  // Threads-Collection (passe ggf. an, falls du einen anderen Namen nutzt)
  // Wir versuchen mehrere plausible Namen.
  const candidates = ["nachrichten", "threads", "nachrichten_threads"];
  let col = null;
  for (const name of candidates) {
    const exists = await db.listCollections({ name }).hasNext();
    if (exists) {
      col = db.collection(name);
      break;
    }
  }
  // Fallback: nimm "nachrichten"
  if (!col) col = db.collection("nachrichten");

  // ---- Filter aufbauen (robust) ----
  const or = [];

  const addIdFilter = (raw) => {
    if (!raw) return;
    // _id-String
    or.push({ participantIds: raw });
    or.push({ "participants.id": raw });
    or.push({ dlId: raw });
    // ObjectId-Variante
    if (ObjectId.isValid(raw)) {
      const oid = new ObjectId(raw);
      or.push({ participantIds: String(oid) });
      or.push({ participantIds: oid });
      or.push({ "participants.id": String(oid) });
      or.push({ "participants.id": oid });
      or.push({ dlId: String(oid) });
      or.push({ dlId: oid });
    }
  };

  const addEmailFilter = (em) => {
    if (!em) return;
    or.push({ participantEmails: em });
    or.push({ "participants.email": em });
    or.push({ dlEmail: em });
    or.push({ email: em });
  };

  addEmailFilter(email);
  addIdFilter(dienstleisterId);
  addIdFilter(userId);

  // Basisfilter für Archiv-Flag.
  const base = { $and: [{ archiviert: archFlag }] };

  // Wenn keine Ident-Kriterien vorhanden sind, liefern wir einfach aktive Threads (leere Liste, wenn keine existieren)
  const query = or.length ? { $and: [...base.$and, { $or: or }] } : base;

  try {
    const items = await col
      .find(query, {
        projection: {
          _id: 1,
          auftragId: 1,
          lastMessage: 1,
          lastAt: 1,
          unreadCount: 1,
          kundeName: 1,
          archiviert: 1,
        },
      })
      .sort({ lastAt: -1, _id: -1 })
      .limit(200)
      .toArray();

    // Sicherheits-Map: Grundform vereinheitlichen
    const normalized = items.map((t) => ({
      _id: t._id,
      auftragId: t.auftragId || t.auftrag || t.jobId || t.orderId || null,
      lastMessage: t.lastMessage || t.preview || "",
      lastAt: t.lastAt || t.updatedAt || t.modifiedAt || t.createdAt || null,
      unreadCount: Number(t.unreadCount || 0),
      kundeName: t.kundeName || t.customerName || null,
      archiviert: !!t.archiviert,
    }));

    return res.status(200).json(normalized);
  } catch (e) {
    console.error("threads list failed:", e);
    return res.status(500).json({ error: "Fehler beim Laden der Threads" });
  }
}
