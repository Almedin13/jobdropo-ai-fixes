// ai-review-bot.js
// 🤖 Erstellt automatisch den KI-Code-Review-Bericht (ai-review-report.md)

import OpenAI from "openai";
import fs from "fs";
import path from "path";

// ✅ OpenAI initialisieren
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("🔍 Starte KI-Code-Review...");

// 🔎 Funktion: Alle JS/JSX/TS/TSX-Dateien im Projekt finden
function getAllCodeFiles(dir, files = []) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!["node_modules", ".next", ".git", "ai-fixes"].includes(file)) {
        getAllCodeFiles(fullPath, files);
      }
    } else if (/\.(jsx?|tsx?)$/.test(file)) {
      files.push(fullPath);
    }
  }
  return files;
}

// 🚀 Schritt 1: Dateien erfassen
const codeFiles = getAllCodeFiles("./");
console.log(`📂 ${codeFiles.length} Dateien gefunden.`);

// 📄 Schritt 2: Ausgabe vorbereiten
let report = `# 🔍 KI-Code-Review Bericht (${new Date().toLocaleString("de-DE")})\n\n`;
report += `**Analysierte Dateien:** ${codeFiles.length}\n\n---\n`;

// ⚙️ Schritt 3: Jede Datei prüfen
for (const file of codeFiles.slice(0, 20)) {
  const code = fs.readFileSync(file, "utf8");
  console.log(`Analysiere Datei: ${file}`);

  const prompt = `
Du bist ein professioneller Code Reviewer.
Analysiere den folgenden Code auf:
- Lesbarkeit
- Wartbarkeit
- Performance
- Sicherheitsrisiken
- Struktur und Architektur
- Verbesserungsvorschläge

Erstelle am Ende eine Bewertung (1–10) und gib konkrete Tipps zur Optimierung.

Datei: ${file}
\`\`\`js
${code.slice(0, 2000)}
\`\`\`
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const feedback = response.choices[0]?.message?.content || "⚠️ Keine Antwort erhalten.";
    report += `## 📄 ${file}\n${feedback}\n\n---\n`;
  } catch (error) {
    console.error(`❌ Fehler bei Datei ${file}:`, error.message);
    report += `## 📄 ${file}\n❌ Fehler: ${error.message}\n\n---\n`;
  }
}

// 🧾 Schritt 4: Bericht speichern
fs.writeFileSync("ai-review-report.md", report, "utf8");
console.log("✅ KI-Code-Review abgeschlossen. Bericht: ai-review-report.md");
