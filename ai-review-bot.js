// ai-review-bot.js
// 🤖 Erstellt automatisch den KI-Code-Review-Bericht (ai-review-report.md)
// mit integrierter Sicherheitsprüfung

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

// 🛡️ Schritt: Vorab-Sicherheitsprüfung auf mögliche Secrets
function scanForSecrets(content, filePath) {
  const patterns = [
    { name: "OpenAI API Key", regex: /sk-[a-zA-Z0-9]{20,}/ },
    { name: "JWT Secret", regex: /jwt|secret|token|api[_-]?key/gi },
    { name: "AWS Key", regex: /AKIA[0-9A-Z]{16}/ },
    { name: "Private Key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
    { name: "Database URI", regex: /mongodb(\+srv)?:\/\/[^\s'"]+/i },
    { name: "Password", regex: /password\s*[:=]\s*['"][^'"]+['"]/i },
  ];

  const findings = [];
  for (const p of patterns) {
    if (p.regex.test(content)) {
      findings.push(`⚠️ **${p.name}** gefunden in: \`${filePath}\``);
    }
  }
  return findings;
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

  // 🔎 Sicherheitsprüfung
  const secrets = scanForSecrets(code, file);
  if (secrets.length > 0) {
    report += `## ⚠️ Sicherheitswarnung in ${file}\n${secrets.join("\n")}\n\n---\n`;
    console.warn(`⚠️ Sicherheitswarnung in ${file}:`, secrets.join(", "));
  }

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
