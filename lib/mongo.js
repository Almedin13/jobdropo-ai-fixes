// lib/mongo.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Fehlende Umgebungsvariable MONGODB_URI (.env.local)");
}

// Globaler Client (Hot-Reload sicher)
let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, { maxPoolSize: 10 });
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;
