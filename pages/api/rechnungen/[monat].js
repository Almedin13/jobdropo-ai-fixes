import clientPromise from "../../../lib/mongodb";
import { generateInvoicePDF } from "../../../lib/pdf/generateInvoice";

export default async function handler(req, res) {
  const { email } = req.query;
  const monat = req.query.monat; // z. B. "07-2025"
  if (!email || !monat) return res.status(400).send("Email oder Monat fehlt");

  const [monatsZahl, jahr] = monat.split("-");

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    // Prüfen, ob die Rechnung bereits archiviert wurde
    const vorhandeneRechnung = await db.collection("rechnungen").findOne({
      dienstleisterEmail: email,
      monat: monatsZahl,
      jahr,
    });

    if (vorhandeneRechnung) {
      // Falls bereits vorhanden → PDF ausgeben
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${monat.replace("-", "_")}_Jobdropo.pdf"`);
      return res.send(vorhandeneRechnung.pdf.buffer); // Achtung: .buffer bei Binärdaten
    }

    // Sonst: Auftragsermittlung
    const angebote = await db.collection("angebote").find({ dienstleisterEmail: email }).toArray();
    const nachrichten = await db.collection("nachrichten").find({ absender: email }).toArray();

    const aktivierteIds = new Set();
    angebote.forEach((a) => {
      const d = new Date(a.erstelltAm);
      if (d.getMonth() + 1 === parseInt(monatsZahl) && d.getFullYear() === parseInt(jahr)) {
        aktivierteIds.add(a.auftragId);
      }
    });
    nachrichten.forEach((n) => {
      const d = new Date(n.erstelltAm);
      if (d.getMonth() + 1 === parseInt(monatsZahl) && d.getFullYear() === parseInt(jahr)) {
        aktivierteIds.add(n.auftragId);
      }
    });

    const anzahl = aktivierteIds.size;
    const netto = anzahl * 2;
    const mwst = +(netto * 0.19).toFixed(2);
    const brutto = +(netto + mwst).toFixed(2);

    const benutzer = await db.collection("benutzer").findOne({ email });

    const empfaenger = {
      name: `${benutzer.vorname || ""} ${benutzer.nachname || ""}`.trim(),
      adresse: `${benutzer.strasse || ""}, ${benutzer.plz || ""} ${benutzer.ort || ""}`.trim(),
    };

    // PDF generieren
    const pdfBuffer = await generateInvoicePDF({
      monat: monatsZahl,
      jahr,
      anzahl,
      netto,
      mwst,
      brutto,
      empfaenger,
    });

    // In MongoDB archivieren
    await db.collection("rechnungen").insertOne({
      dienstleisterEmail: email,
      monat: monatsZahl,
      jahr,
      anzahl,
      netto,
      mwst,
      brutto,
      erstelltAm: new Date(),
      pdf: pdfBuffer,
    });

    // PDF ausliefern
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${monat.replace("-", "_")}_Jobdropo.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Fehler beim Erzeugen/Laden der Rechnung:", err);
    res.status(500).send("Fehler beim Erzeugen oder Abrufen der Rechnung");
  }
}
