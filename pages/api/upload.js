// pages/api/upload.js
import fs from "fs";
import path from "path";
import { IncomingForm } from "formidable";

export const config = {
  api: { bodyParser: false }, // wichtig für formidable
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const form = new IncomingForm({
      multiples: true,
      uploadDir,
      keepExtensions: true,
      // saubere Dateinamen erzeugen
      filename: (name, ext, part, form) => {
        const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return `${unique}${ext}`;
      },
      maxFileSize: 20 * 1024 * 1024, // 20 MB
    });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
    });

    const list = files?.bilder
      ? Array.isArray(files.bilder) ? files.bilder : [files.bilder]
      : [];

    const urls = list.map((f) => {
      // formidable v3: newFilename ist gesetzt, filepath zeigt auf die gespeicherte Datei
      const filename = f.newFilename || path.basename(f.filepath || f.path);
      return `/uploads/${filename}`;
    });

    return res.status(200).json({ ok: true, urls });
  } catch (err) {
    console.error("Upload-Fehler:", err);
    return res.status(500).json({ ok: false, error: "Upload fehlgeschlagen." });
  }
}
