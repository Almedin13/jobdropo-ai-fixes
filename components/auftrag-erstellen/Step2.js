// components/auftrag-erstellen/Step2.jsx
import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router";

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "");

function buildDisplayName({ vorname, nachname, name, email, firma }) {
  // ✅ Jetzt beide Namen kombiniert
  const full = [vorname, nachname].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (name && String(name).trim()) return String(name).trim();
  if (firma && String(firma).trim()) return String(firma).trim();
  if (email && /\S+@\S+\.\S+/.test(email)) {
    const local = email.split("@")[0];
    const parts = local.split(/[._\-+]+/).filter(Boolean);
    if (parts.length) return parts.map(cap).join(" ");
  }
  return "Auftraggeber";
}

export default function Step2({ formData, setFormData, onBack }) {
  const { user } = useUser();
  const router = useRouter();
  const [preisVorschlag, setPreisVorschlag] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // console.log("👤User aus Context:", user);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Fehler: Benutzer nicht eingeloggt");
      return;
    }

    setSubmitting(true);

    const datumDurchfuehrung =
      formData?.datumDurchfuehrung === "Festes Datum"
        ? formData?.festesDatum
        : formData?.datumDurchfuehrung || null;

    const parsedFestpreis = !preisVorschlag
      ? Number.isFinite(parseFloat(formData.preis))
        ? parseFloat(formData.preis)
        : null
      : null;

    // 🧩 Auftraggeberdaten inkl. Vor- und Nachname
    const denorm = {
      id: user?._id || user?.id || null,
      vorname: user?.vorname || user?.firstName || "",
      nachname: user?.nachname || user?.lastName || "",
      name: user?.name || "",
      email: user?.email || "",
      telefon: formData?.telefon || user?.telefon || user?.phone || "",
      firma: user?.firma || user?.company || "",
    };

    // ✅ Vollständiger Anzeigename (Vorname + Nachname)
    const auftraggeberName = buildDisplayName(denorm);

    // 🟢 Auftrag wird vorbereitet
    const auftrag = {
      ...formData,
      datumDurchfuehrung,
      datumDurchfuehrungLabel: formData?.datumDurchfuehrung || "",
      festpreis: parsedFestpreis,
      preisVorschlagErlaubt: preisVorschlag,
      erstelltAm: new Date().toISOString(),
      status: "offen",
      erstelltVon: user.email,
      auftraggeberId: denorm.id,
      telefon: denorm.telefon || "",
      auftraggeberName, // <-- jetzt "Vorname Nachname"
      auftraggeber: denorm, // vollständige Struktur
    };

    try {
      console.log("📦 Auftrag wird gesendet:", auftrag);
      const res = await fetch("/api/auftraege", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auftrag),
      });

      if (res.ok) {
        setTimeout(() => router.push("/dashboard?menu=auftraege"), 300);
      } else {
        let errMsg = "Fehler beim Erstellen des Auftrags";
        try {
          const err = await res.json();
          errMsg = err?.message || errMsg;
        } catch {}
        console.error("❌ Fehler beim Erstellen:", errMsg);
        alert(errMsg);
      }
    } catch (error) {
      console.error("❌ Netzwerkfehler:", error);
      alert("Netzwerkfehler");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-md rounded">
      <h2 className="text-xl font-semibold mb-4">Schritt 2: Preis festlegen</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Festpreis (€)</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={formData.preis || ""}
            onChange={(e) => setFormData({ ...formData, preis: e.target.value })}
            disabled={preisVorschlag}
            required={!preisVorschlag}
            step="0.01"
            min="0"
          />
        </div>

        <div className="mb-6 flex items-center space-x-2">
          <input
            id="vorschlag"
            type="checkbox"
            checked={preisVorschlag}
            onChange={(e) => {
              setPreisVorschlag(e.target.checked);
              if (e.target.checked) {
                setFormData({ ...formData, preis: "" });
              }
            }}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="vorschlag" className="text-sm text-gray-700">
            Dienstleister darf Preis vorschlagen
          </label>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Zurück
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Speichern..." : "Auftrag erstellen"}
          </button>
        </div>
      </form>
    </div>
  );
}
