import PDFDocument from "pdfkit";
import getStream from "get-stream";

export async function generateInvoicePDF({ monat, jahr, anzahl, netto, mwst, brutto, empfaenger }) {
  const doc = new PDFDocument({ margin: 50 });
  const stream = doc.pipe(require("stream").PassThrough());

  // Platzhalter Firmendaten
  const absender = {
    firma: "Jobdropo GmbH",
    adresse: "Musterstraße 1, 12345 Berlin",
    email: "info@jobdropo.de",
    ustId: "DE123456789",
    iban: "DE12 3456 7890 1234 5678 00",
    bic: "GENODEF1XXX",
  };

  // Rechnungsnummer & Datum
  const rechnungsNr = `${jahr}${monat.padStart(2, "0")}-001`;
  const rechnungsdatum = new Date().toLocaleDateString("de-DE");

  // PDF Aufbau
  doc.fontSize(16).text(absender.firma, { align: "right" });
  doc.fontSize(10).text(absender.adresse, { align: "right" });
  doc.text(`USt-IdNr: ${absender.ustId}`, { align: "right" });
  doc.text(`E-Mail: ${absender.email}`, { align: "right" });

  doc.moveDown(2);

  doc.fontSize(12).text(`${empfaenger.name}`, { continued: true }).text(`\n${empfaenger.adresse}`);
  doc.moveDown();
  doc.fontSize(14).text(`Rechnung`, { underline: true });
  doc.moveDown();
  doc.fontSize(10).text(`Rechnungsnummer: ${rechnungsNr}`);
  doc.text(`Rechnungsdatum: ${rechnungsdatum}`);
  doc.text(`Leistungszeitraum: 01. ${monat}.${jahr} – ${new Date(jahr, parseInt(monat), 0).getDate()}. ${monat}.${jahr}`);
  doc.moveDown();

  // Tabelle
  doc.fontSize(12).text(`Position:`, { underline: true });
  doc.moveDown(0.5);
  doc.text(`Nutzungsgebühr pro aktivem Auftrag`);
  doc.text(`Anzahl: ${anzahl} x 2,00 €`);
  doc.moveDown();

  doc.text(`Nettosumme: ${netto.toFixed(2)} €`);
  doc.text(`zzgl. 19 % MwSt: ${mwst.toFixed(2)} €`);
  doc.font("Helvetica-Bold").text(`Gesamtbetrag: ${brutto.toFixed(2)} €`);

  doc.moveDown(2);
  doc.font("Helvetica").fontSize(10);
  doc.text(`Zahlungsziel: 14 Tage nach Rechnungseingang`, { align: "left" });
  doc.text(`IBAN: ${absender.iban}`, { align: "left" });
  doc.text(`BIC: ${absender.bic}`, { align: "left" });
  doc.moveDown(1);
  doc.text(`Diese Rechnung wurde maschinell erstellt und ist auch ohne Unterschrift gültig.`, { italic: true });

  doc.end();

  return await getStream.buffer(stream);
}
