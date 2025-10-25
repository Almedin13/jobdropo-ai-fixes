// pages/api/nachrichten/delete.js
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST erlaubt" });
  }

  try {
    let { threadId, auftragId } = req.body || {};

    if (!threadId && !auftragId) {
      return res.status(400).json({ error: "threadId ODER auftragId muss angegeben sein" });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const toOid = (v) => (ObjectId.isValid(v) ? new ObjectId(v) : null);
    const asString = (v) => (v == null ? undefined : String(v));

    // --- Filter-Builder für Threads ---
    const threadFilter = (() => {
      const ors = [];

      if (threadId) {
        const tidStr = asString(threadId);
        const tidOid = toOid(threadId);
        // übliche Felder
        ors.push({ _id: tidStr });
        if (tidOid) ors.push({ _id: tidOid });
        ors.push({ threadId: tidStr });
        if (tidOid) ors.push({ threadId: tidOid });
        // manche nutzen conversationId/convId
        ors.push({ conversationId: tidStr });
        if (tidOid) ors.push({ conversationId: tidOid });
        ors.push({ convId: tidStr });
        if (tidOid) ors.push({ convId: tidOid });
      }

      if (auftragId) {
        const aidStr = asString(auftragId);
        const aidOid = toOid(auftragId);
        ors.push({ auftragId: aidStr });
        if (aidOid) ors.push({ auftragId: aidOid });
        // alternative Feldnamen
        ors.push({ orderId: aidStr });
        if (aidOid) ors.push({ orderId: aidOid });
        ors.push({ jobId: aidStr });
        if (aidOid) ors.push({ jobId: aidOid });
      }

      return { $or: ors };
    })();

    // --- Filter-Builder für Messages ---
    const messageFilter = (() => {
      const ors = [];

      if (threadId) {
        const tidStr = asString(threadId);
        const tidOid = toOid(threadId);
        // übliche Verknüpfungsfelder in Nachrichten
        ors.push({ threadId: tidStr });
        if (tidOid) ors.push({ threadId: tidOid });
        ors.push({ conversationId: tidStr });
        if (tidOid) ors.push({ conversationId: tidOid });
        ors.push({ convId: tidStr });
        if (tidOid) ors.push({ convId: tidOid });
      }

      if (auftragId) {
        const aidStr = asString(auftragId);
        const aidOid = toOid(auftragId);
        ors.push({ auftragId: aidStr });
        if (aidOid) ors.push({ auftragId: aidOid });
        ors.push({ orderId: aidStr });
        if (aidOid) ors.push({ orderId: aidOid });
        ors.push({ jobId: aidStr });
        if (aidOid) ors.push({ jobId: aidOid });
      }

      return { $or: ors };
    })();

    // --- Collections ermitteln ---
    const names = (await db.listCollections().toArray()).map((c) => c.name);

    // Kandidaten: Threads
    const threadCollections = names.filter((n) =>
      /(^|_)(thread|threads|konversation|conversation)s?($|_)/i.test(n)
    );
    // am häufigsten bei dir
    if (!threadCollections.includes("nachrichten")) threadCollections.unshift("nachrichten");

    // Kandidaten: Messages
    const messageCollections = names.filter((n) =>
      /(^|_)(message|messages|nachricht|nachrichten|chat|inbox|msgs)s?($|_)/i.test(n)
    );

    let deletedThreads = 0;
    let deletedMessages = 0;
    const touchedThreadCols = [];
    const touchedMessageCols = [];

    // 1) Threads löschen
    for (const colName of threadCollections) {
      try {
        const col = db.collection(colName);
        const r = await col.deleteMany(threadFilter);
        if (r.deletedCount) {
          deletedThreads += r.deletedCount;
          touchedThreadCols.push(colName);
        }
      } catch (e) {
        // falls eine Collection ein anderes Schema hat → einfach überspringen
      }
    }

    // 2) Messages löschen
    for (const colName of messageCollections) {
      try {
        const col = db.collection(colName);
        const r = await col.deleteMany(messageFilter);
        if (r.deletedCount) {
          deletedMessages += r.deletedCount;
          touchedMessageCols.push(colName);
        }
      } catch (e) {
        // einfach weiter
      }
    }

    return res.status(200).json({
      ok: true,
      deletedThreads,
      deletedMessages,
      threadCollectionsTried: threadCollections,
      messageCollectionsTried: messageCollections,
      threadCollectionsTouched: touchedThreadCols,
      messageCollectionsTouched: touchedMessageCols,
    });
  } catch (err) {
    console.error("Löschen-Fehler:", err);
    return res.status(500).json({ error: "Serverfehler beim Löschen" });
  }
}
