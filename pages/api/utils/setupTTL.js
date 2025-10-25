// pages/api/utils/setupTTL.js
import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // TTL: löscht Dokumente 30 Tage nach deletedAt automatisch
    const ttlSeconds = 30 * 24 * 60 * 60;

    // Threads-Collection (bei dir "nachrichten")
    await db.collection("nachrichten").createIndex(
      { deletedAt: 1 },
      { expireAfterSeconds: ttlSeconds, name: "ttl_deletedAt_30d" }
    );

    // Optional: falls du eine separate Messages-Collection hast:
    // await db.collection("messages").createIndex(
    //   { deletedAt: 1 },
    //   { expireAfterSeconds: ttlSeconds, name: "ttl_deletedAt_30d" }
    // );

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "TTL setup failed" });
  }
}
