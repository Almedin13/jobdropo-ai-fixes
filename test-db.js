import { MongoClient } from "mongodb";

async function testConnection() {
  const uri = "mongodb+srv://<almedinsalihovic>:<ovomoradaradi>@meinauftrag.mongodb.net/vermittlungsapp?retryWrites=true&w=majority";

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Verbindung erfolgreich!");
  } catch (err) {
    console.error("Verbindungsfehler:", err);
  } finally {
    await client.close();
  }
}

testConnection();
