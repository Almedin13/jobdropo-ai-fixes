import clientPromise from "../../../lib/mongodb";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "E-Mail erforderlich" });

  const client = await clientPromise;
  const db = client.db("vermittlungsapp");
  const user = await db.collection("benutzer").findOne({ email });

  if (!user) {
    return res.status(200).json({ message: "Wenn ein Konto existiert, wurde eine E-Mail gesendet." });
  }

  const token = uuidv4();
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 Stunde gültig

  await db.collection("passwortResets").insertOne({
    email,
    token,
    expires,
  });

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/passwort-zuruecksetzen/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Passwort zurücksetzen",
    html: `<p>Klicke auf den folgenden Link, um dein Passwort zurückzusetzen:</p>
           <a href="${resetUrl}">${resetUrl}</a>`,
  });

  return res.status(200).json({ message: "Wenn ein Konto existiert, wurde eine E-Mail gesendet." });
}
