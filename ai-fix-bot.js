// ai-fix-bot.js – KI-Autofix-Assistent mit Git-Automation
import "dotenv/config";
import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
});

const reportPath = path.join(process.cwd(), "ai-review-report.md");
const summaryPath = path.join(process.cwd(), "ai-fix-summary.md");

// === Hilfsfunktionen ===
function parseReport(reportText) {
  const sections = reportText.split(/^## 📄/m).slice(1);
  const results = [];
  for (const section of sections) {
    const [header, ...rest] = section.trim().split("\n");
    const fileName = header.trim();
    const content = rest.join("\n").trim();
    results.push({ fileName, content });
  }
  return results;
}

function promptUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function backupFile(filePath, content) {
  const backupPath = filePath + ".bak";
  fs.writeFileSync(backupPath, content, "utf8");
}

function gitCommit(file, message) {
  try {
    execSync(`git add "${file}"`, { stdio: "ignore" });
    execSync(`git commit -m "${message}"`, { stdio: "ignore" });
    console.log(`🟢 Git-Commit erstellt: ${message}`);
  } catch (err) {
    console.warn(`⚠️ Git-Commit fehlgeschlagen für ${file}: ${err.message}`);
  }
}

// === Hauptfunktion ===
async function applyFixes() {
  console.log("🧠 Starte KI-Autofix-Assistent (mit Git)...\n");

  if (!fs.existsSync(reportPath)) {
    console.error("❌ Kein ai-review-report.md gefunden. Bitte zuerst 'node ai-bot.js' ausführen.");
    return;
  }

  const reportText = fs.readFileSync(reportPath, "utf8");
  const entries = parseReport(reportText);

  console.log(`📋 ${entries.length} Dateien mit Vorschlägen gefunden.\n`);

  const summary = {
    improved: [],
    skipped: [],
    failed: [],
  };

  for (const entry of entries) {
    const filePath = path.join(process.cwd(), entry.fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Datei nicht gefunden: ${filePath}`);
      summary.failed.push({ file: entry.fileName, reason: "Nicht gefunden" });
      continue;
    }

    console.log(`\n📄 Datei: ${entry.fileName}`);
    console.log("💡 Vorschläge:");
    console.log(entry.content.split("\n").map((l) => "   " + l).join("\n"));

    const answer = await promptUser("\n👉 Möchtest du diese Änderungen anwenden? (j/n): ");

    if (answer !== "j" && answer !== "ja") {
      console.log("⏭️ Übersprungen.\n");
      summary.skipped.push(entry.fileName);
      continue;
    }

    const original = readFileSafe(filePath);
    backupFile(filePath, original);
    console.log("💾 Backup erstellt:", filePath + ".bak");

    console.log("🤖 Wende KI-Vorschläge an...");
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content:
              "Du bist ein erfahrener Senior-Fullstack-Entwickler. " +
              "Verbessere den folgenden Code basierend auf den Vorschlägen. " +
              "Behalte Stil, Struktur und Funktionalität vollständig bei. " +
              "Antworte NUR mit dem vollständigen, korrigierten Code.",
          },
          { role: "user", content: `Vorschläge:\n${entry.content}\n\nOriginalcode:\n${original}` },
        ],
        temperature: 0.3,
      });

      const newCode = response.choices[0].message.content.trim();

      if (!newCode.includes("import") && !newCode.includes("function") && !newCode.includes("export")) {
        console.warn("⚠️ Antwort sieht nicht nach Code aus. Datei wird übersprungen.");
        summary.failed.push({ file: entry.fileName, reason: "Antwort kein Code" });
        continue;
      }

      fs.writeFileSync(filePath, newCode, "utf8");
      console.log(`✅ Änderungen angewendet auf: ${entry.fileName}`);
      summary.improved.push(entry.fileName);

      // 🚀 Automatischer Git-Commit
      gitCommit(entry.fileName, `KI-Autofix: ${entry.fileName}`);

    } catch (err) {
      console.error(`❌ Fehler bei ${entry.fileName}: ${err.message}`);
      summary.failed.push({ file: entry.fileName, reason: err.message });
    }
  }

  // === Zusammenfassung ===
  const improved = summary.improved.length;
  const skipped = summary.skipped.length;
  const failed = summary.failed.length;

  console.log("\n🎯 Zusammenfassung:");
  console.log(`✅ Verbesserte Dateien: ${improved}`);
  console.log(`⏭️ Übersprungen: ${skipped}`);
  console.log(`❌ Fehler: ${failed}`);

  // === Markdown-Summary schreiben ===
  const summaryContent = [
    "# 🧩 KI-AutoFix Bericht (mit Git)",
    `**Datum:** ${new Date().toLocaleString("de-DE")}`,
    "",
    `- ✅ Verbesserte Dateien: ${improved}`,
    `- ⏭️ Übersprungen: ${skipped}`,
    `- ❌ Fehler: ${failed}`,
    "",
    "## Details",
    "### ✅ Verbesserte Dateien",
    summary.improved.map((f) => `- ${f}`).join("\n") || "_Keine_",
    "",
    "### ⏭️ Übersprungene Dateien",
    summary.skipped.map((f) => `- ${f}`).join("\n") || "_Keine_",
    "",
    "### ❌ Fehlgeschlagene Dateien",
    summary.failed.map((f) => `- ${f.file} → ${f.reason}`).join("\n") || "_Keine_",
  ].join("\n");

  fs.writeFileSync(summaryPath, summaryContent, "utf8");

  console.log(`\n📝 Zusammenfassung gespeichert unter: ${summaryPath}`);
  console.log("💾 Backups liegen als .bak neben den Originaldateien.");
  console.log("🚀 KI-Autofix abgeschlossen!\n");
}

applyFixes();
