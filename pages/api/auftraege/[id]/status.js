// pages/api/auftraege/[id]/status.js
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("vermittlungsapp");

  const { id } = req.query;

  if (req.method === "PATCH") {
    const { status } = req.body;
    try {
      const result = await db
        .collection("auftraege")
        .updateOne({ _id: new ObjectId(id) }, { $set: { status } });
      res.status(200).json({ success: true, result });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
