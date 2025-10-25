// ai-bot.js – KI Code Review Bot (Vorschläge + Bewertungs-Score + Markdown-Report)
import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

// --- Projektstruktur ---
const projectRoot = process.cwd();
const includeDirs = ["pages", "components", "context", "lib"];
const maxFiles = 25; // Testlimit

// --- Hilfsfunktionen ---
function collectFiles(baseDir) {
  let files = [];
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(baseDir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(collectFiles(fullPath));
    } else if (entry.name.endsWith(".js") || entry.name.endsWith(".jsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

// --- Hauptfunktion ---
async function analyzeCode() {
  console.log("🔍 Starte erweitertes Code-Review...\n");

  let allFiles = [];
  for (const dir of includeDirs) {
    const abs = path.join(projectRoot, dir);
    if (fs.existsSync(abs)) allFiles = allFiles.concat(collectFiles(abs));
  }
  if (allFiles.length === 0) {
    console.log("⚠️  Keine Dateien gefunden.");
    return;
  }

  console.log(`📂 ${allFiles.length} Dateien erkannt.\n`);
  const subset = allFiles.slice(0, maxFiles);

  const reportLines = [
    "# 🧠 KI Code-Review Report mit Bewertungs-Score",
    `**Projekt:** ${projectRoot}`,
    `**Analysierte Dateien:** ${subset.length}`,
    `**Datum:** ${new Date().toLocaleString("de-DE")}`,
    "\n---\n",
  ];

  for (const filePath of subset) {
    const relPath = path.relative(projectRoot, filePath);
    const code = readFileSafe(filePath);
    if (!code.trim()) continue;

    console.log(`🧩 Prüfe: ${relPath}`);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content:
              "Du bist ein erfahrener Senior-Fullstack-Entwickler. " +
              "Analysiere den folgenden Code und gib maximal 5 gezielte Verbesserungsvorschläge. " +
              "Bewerte anschließend die Codequalität auf einer Skala von 0 bis 100 Prozent " +
              "(100 %=sehr sauber, 0 %=katastrophal). " +
              "Formatiere die Ausgabe so:\n" +
              "Bewertung: <Zahl>%\n\nVorschläge:\n1. ...\n2. ...",
          },
          { role: "user", content: code },
        ],
        temperature: 0.2,
      });

      const text = response.choices[0].message.content.trim();
      const match = text.match(/Bewertung:\s*(\d{1,3})%/i);
      const score = match ? parseInt(match[1]) : "–";
      console.log(`💯 Code-Qualität: ${score}%`);
      console.log(text + "\n──────────────────────────────\n");

      reportLines.push(`## 📄 ${relPath}`);
      reportLines.push(`**💯 Code-Qualität:** ${score}%\n`);
      reportLines.push(text.replace(/Bewertung:\s*\d{1,3}%/i, "").trim());
      reportLines.push("\n---\n");
    } catch (err) {
      console.error(`❌ Fehler bei ${relPath}:`, err.message);
      reportLines.push(`## 📄 ${relPath}\nFehler: ${err.message}\n---\n`);
    }
  }

  const reportPath = path.join(projectRoot, "ai-review-report.md");
  fs.writeFileSync(reportPath, reportLines.join("\n"), "utf8");
  console.log("✅ Analyse abgeschlossen.");
  console.log(`📝 Bericht gespeichert unter: ${reportPath}\n`);
}

analyzeCode();
