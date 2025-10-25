// pages/api/auftraege/einzeln.js
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

// kleine Helfer
const pickStr = (...vals) => {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return null;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Nur GET-Anfragen erlaubt" });
  }

  const { id } = req.query;
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Ungültige Auftrags-ID" });
  }

  try {
    const client = await clientPromise;
    // Wenn du in clientPromise schon die DB setzt, nutze client.db() statt des Namens
    const db = client.db("vermittlungsapp");

    // 1) Auftrag lesen
    const _id = new ObjectId(id);
    const auftrag = await db.collection("auftraege").findOne({ _id });

    if (!auftrag) {
      return res.status(404).json({ message: "Auftrag nicht gefunden" });
    }

    // 2) Adresse/Datum/Titel/Status defensiv herausziehen
    const adresse = auftrag.adresse || {};
    const strasse =
      pickStr(auftrag.strasse, adresse.strasse, adresse.street) || null;
    const hausnummer =
      pickStr(auftrag.hausnummer, adresse.hausnummer, adresse.hn, adresse.houseNumber) || null;
    const plz =
      pickStr(auftrag.plz, adresse.plz, adresse.postcode, adresse.zip) || null;
    const ort =
      pickStr(auftrag.ort, auftrag.stadt, adresse.ort, adresse.stadt, adresse.city) || null;

    const datumDurchfuehrung =
      pickStr(
        auftrag.datumDurchfuehrung,
        auftrag.ausfuehrungAm,
        auftrag.startDatum,
        auftrag.startDate,
        auftrag.termin
      ) || null;

    const titel = pickStr(auftrag.titel, auftrag.title) || null;
    const status = pickStr(auftrag.status) || null;

    // 3) Kundendaten aus dem Auftrag, sonst via kundeId nachladen
    let kundeVorname =
      pickStr(
        auftrag.kundeVorname,
        auftrag.vorname,
        auftrag.firstName,
        auftrag.kunde?.vorname
      ) || null;

    let kundeNachname =
      pickStr(
        auftrag.kundeNachname,
        auftrag.nachname,
        auftrag.lastName,
        auftrag.kunde?.nachname
      ) || null;

    if ((!kundeVorname || !kundeNachname) && auftrag.kundeId && ObjectId.isValid(auftrag.kundeId)) {
      const kid = new ObjectId(auftrag.kundeId);

      // Versuche zuerst users, dann kunden (je nach deinem Schema)
      const userDoc =
        (await db.collection("users").findOne({ _id: kid }, { projection: { vorname: 1, nachname: 1, name: 1 } })) ||
        (await db.collection("kunden").findOne({ _id: kid }, { projection: { vorname: 1, nachname: 1, name: 1 } }));

      if (userDoc) {
        // name ggf. splitten, falls nur ein Feld vorhanden ist
        if (!kundeVorname && !kundeNachname && userDoc.name) {
          const parts = String(userDoc.name).trim().split(/\s+/);
          if (parts.length === 1) {
            kundeVorname = parts[0];
          } else if (parts.length >= 2) {
            kundeVorname = parts.slice(0, -1).join(" ");
            kundeNachname = parts.slice(-1).join(" ");
          }
        }
        kundeVorname = kundeVorname || pickStr(userDoc.vorname);
        kundeNachname = kundeNachname || pickStr(userDoc.nachname);
      }
    }

    // 4) Original-Dokument + flache Felder zurückgeben (bricht nichts)
    return res.status(200).json({
      ...auftrag,
      titel,                // ggf. überschreibt vorhandenes Feld nur mit gleichem Wert
      status,
      kundeVorname,
      kundeNachname,
      strasse,
      hausnummer,
      plz,
      ort,
      datumDurchfuehrung,
    });
  } catch (error) {
    console.error("Fehler beim Abrufen des Auftrags:", error);
    return res.status(500).json({ message: "Interner Serverfehler" });
  }
}
