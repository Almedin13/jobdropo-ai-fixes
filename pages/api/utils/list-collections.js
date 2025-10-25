// pages/api/utils/list-collections.js
import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not available in production" });
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Nur GET erlaubt" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const cols = await db.listCollections().toArray();
    const result = [];
    for (const c of cols) {
      const col = db.collection(c.name);
      let count = 0;
      try { count = await col.estimatedDocumentCount(); } catch {}
      result.push({ name: c.name, count });
    }
    // sortiert nach count absteigend
    result.sort((a, b) => (b.count || 0) - (a.count || 0));

    return res.status(200).json({ db: process.env.MONGODB_DB, collections: result });
  } catch (e) {
    console.error("list-collections error:", e);
    return res.status(500).json({ error: "Fehler beim Auflisten der Collections" });
  }
}
