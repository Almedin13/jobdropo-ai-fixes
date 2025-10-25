export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Nur POST erlaubt" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "E-Mail fehlt" });
  }

  try {
    // Einladungscode zufällig generieren
    const code = Math.random().toString(36).substring(2, 10);

    // In einer echten App würdest du den Code speichern + Ablaufdatum setzen
    // Wir senden nur zurück:
    const link = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/register?invite=${code}`;

    return res.status(200).json({
      message: "Einladungslink erstellt",
      link,
    });
  } catch (err) {
    console.error("Fehler beim Erstellen des Einladungslinks:", err);
    return res.status(500).json({ message: "Serverfehler" });
  }
}
