// pages/api/nachrichten/threads-from-messages.js
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Aggregiert Threads (1 Zeile je Auftrag/Konversation) aus der Collection "nachrichten".
 * Sehr robuste Feld-Normalisierung für deutsch/engl. Varianten:
 *  - Auftrag/Thread-ID-Felder: auftragId, auftrag, auftragsId, auftrag_id, orderId, jobId, threadId, konversationId …
 *  - Zeit: createdAt, sentAt, datum, timestamp, zeit, erstelltAm, gesendetAm …
 *  - Text: text, nachricht, message, body, inhalt, preview …
 *  - Teilnehmer: participants{email,id}, participantEmails, participantIds, from/von, to/an, senderEmail, empfaengerEmail …
 *  - Kundenname: kundeName, kundenName, auftraggeberName, kunde, name …
 *
 * Query (alle optional):
 *  - email
 *  - dienstleisterId
 *  - userId
 *  - archiviert: "0"|"1" (Default "0")
 *  - all: "1"  → ignoriert Nutzer-Filter (nur DEV/Debug sinnvoll)
 */

const anyOf = (...arr) => ({ $ifNull: arr });

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Nur GET erlaubt" });

  const { email, dienstleisterId, userId, archiviert, all } = req.query;
  const archFlag =
    String(archiviert ?? "0") === "1" || String(archiviert ?? "0").toLowerCase() === "true";

  let client, db;
  try {
    client = await clientPromise;
    db = client.db(process.env.MONGODB_DB);
  } catch (e) {
    console.error("DB connect failed:", e);
    return res.status(500).json({ error: "DB-Verbindung fehlgeschlagen" });
  }

  // Wir verwenden explizit die Collection "nachrichten"
  const col = db.collection("nachrichten");

  // ---- Nutzer-Match (robust) ----
  const orUser = [];
  const addId = (raw) => {
    if (!raw) return;
    orUser.push(
      { participantIds: raw },
      { "participants.id": raw },
      { toId: raw },
      { fromId: raw },
      { empfaengerId: raw },
      { senderId: raw },
      { dienstleisterId: raw },
      { benutzerId: raw },
      { userId: raw }
    );
    if (ObjectId.isValid(raw)) {
      const oid = new ObjectId(raw);
      const ids = [raw, String(oid), oid];
      ids.forEach((v) => {
        orUser.push(
          { participantIds: v },
          { "participants.id": v },
          { toId: v },
          { fromId: v },
          { empfaengerId: v },
          { senderId: v },
          { dienstleisterId: v },
          { benutzerId: v },
          { userId: v }
        );
      });
    }
  };
  const addEmail = (em) => {
    if (!em) return;
    orUser.push(
      { participantEmails: em },
      { "participants.email": em },
      { to: em },
      { from: em },
      { an: em },
      { von: em },
      { empfaengerEmail: em },
      { senderEmail: em },
      { dlEmail: em },
      { email: em }
    );
  };
  if (!all) {
    addEmail(email);
    addId(dienstleisterId);
    addId(userId);
  }
  const matchUser = all ? {} : (orUser.length ? { $or: orUser } : {});

  // Archiv-Flag berücksichtigen, sofern vorhanden
  const matchArch = archFlag
    ? { archiviert: true }
    : { $or: [{ archiviert: false }, { archiviert: { $exists: false } }] };

  const matchStage =
    Object.keys(matchUser).length > 0 ? { $and: [matchUser, matchArch] } : matchArch;

  // ---- Normalisierung von Feldern ----
  const addNormalized = {
    $addFields: {
      _orderId: anyOf(
        "$auftragId",
        "$auftrag",
        "$auftragsId",
        "$auftrag_id",
        "$orderId",
        "$jobId",
        "$threadId",
        "$konversationId",
        "$conversationId",
        "$chatId"
      ),
      _created: anyOf(
        "$createdAt",
        "$sentAt",
        "$timestamp",
        "$zeit",
        "$datum",
        "$erstelltAm",
        "$gesendetAm",
        "$updatedAt",
        "$modifiedAt"
      ),
      _text: anyOf("$text", "$nachricht", "$message", "$body", "$inhalt", "$preview", "$betreff"),
      _kundeName: anyOf(
        "$kundeName",
        "$kundenName",
        "$auftraggeberName",
        "$kunde",
        "$name",
        "$customerName"
      ),
      _unreadFor: anyOf("$unreadFor", []),
    },
  };

  const pipeline = [
    { $match: matchStage },
    addNormalized,
    { $match: { _orderId: { $ne: null } } },
    { $sort: { _created: -1, _id: -1 } },
    {
      $group: {
        _id: "$_orderId",
        lastMessage: { $first: "$_text" },
        lastAt: { $first: "$_created" },
        kundeName: { $first: "$_kundeName" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $in: [email || null, "$_unreadFor"] },
                  { $in: [dienstleisterId || null, "$_unreadFor"] },
                  { $in: [userId || null, "$_unreadFor"] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $limit: 200 },
  ];

  try {
    const rows = await col.aggregate(pipeline).toArray();
    const normalized = rows.map((r) => ({
      _id: r._id,            // hier = auftragId/ThreadId
      auftragId: r._id,
      lastMessage: r.lastMessage || "",
      lastAt: r.lastAt || null,
      unreadCount: Number(r.unreadCount || 0),
      kundeName: r.kundeName || null,
      archiviert: !!archFlag,
    }));
    return res.status(200).json(normalized);
  } catch (e) {
    console.error("threads-from-messages failed:", e);
    return res.status(500).json({ error: "Aggregation fehlgeschlagen" });
  }
}
