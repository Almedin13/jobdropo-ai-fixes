// pages/api/user/resetPassword.js
import clientPromise from "../../../lib/mongodb";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "E-Mail ist erforderlich" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("vermittlungsapp");

    const user = await db.collection("nutzer").findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "Falls die E-Mail existiert, wurde ein Link gesendet." });
    }

    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `Passwort Reset <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Passwort zurücksetzen",
      html: `<p>Klicke auf den folgenden Link, um dein Passwort zurückzusetzen:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    res.status(200).json({ message: "E-Mail wurde gesendet" });
  } catch (error) {
    console.error("Fehler beim Passwort-Reset:", error);
    res.status(500).json({ message: "Interner Serverfehler" });
  }
}
