// pages/auftrag/bearbeiten/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

/** --- OPTIONEN --- */
const BRANCHEN = [
  "Handwerk",
  "Reinigung",
  "Gastronomie",
  "IT & Software",
  "Transport & Logistik",
  "Bau",
  "Haus & Garten",
  "Sonstiges",
];

const UNTERBERUFE_BY_BRANCHE = {
  Handwerk: ["Maurer", "Elektriker", "Maler", "Sanitär/Heizung", "Tischler", "Dachdecker"],
  Reinigung: ["Gebäudereinigung", "Fensterreinigung", "Unterhaltsreinigung", "Grundreinigung"],
  "Gastronomie": ["Koch", "Service", "Barista", "Küche-Helfer"],
  "IT & Software": ["Frontend", "Backend", "Fullstack", "DevOps", "QA/Testing"],
  "Transport & Logistik": ["Fahrer", "Packer", "Lagerist", "Kurier"],
  Bau: ["Bauhelfer", "Polier", "Betonbauer", "Kranführer"],
  "Haus & Garten": ["Gärtner", "Hausmeister", "Winterdienst"],
  Sonstiges: ["Allrounder", "Helfer", "Beratung"],
};

const DURCHFUEHRUNG_PRESETS = [
  "Heute",
  "Morgen",
  "Diese Woche",
  "Nächste Woche",
  "Diesen Monat",
  "Flexibel",
];

const TURNUS_OPTIONS = ["Einmalig", "Täglich", "Wöchentlich", "Monatlich", "Nach Bedarf"];
const STATUS_OPTIONS = ["offen", "pausiert", "beauftragt", "geschlossen"];

export default function AuftragBearbeiten() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    titel: "",
    beschreibung: "",
    branche: "",
    unterberuf: "",
    datumDurchfuhrung: "",
    festesDatum: "",
    turnus: "",
    turnusDetails: "",
    branchenspezifischeDetails: "",
    preis: "",
    preisVorschlagErlaubt: true,
    status: "offen",
    bilder: [],
  });

  const unterberufOptions = useMemo(() => {
    const list = UNTERBERUFE_BY_BRANCHE[form.branche] || [];
    if (form.unterberuf && !list.includes(form.unterberuf)) {
      setForm((f) => ({ ...f, unterberuf: "" }));
    }
    return list;
  }, [form.branche, form.unterberuf]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/auftraege/${id}`);
        const data = await res.json();
        const a = data?.ok ? (data.item || data.data) : data;

        setForm({
          titel: a?.titel ?? "",
          beschreibung: a?.beschreibung ?? "",
          branche: a?.branche ?? "",
          unterberuf: a?.unterberuf ?? "",
          datumDurchfuhrung: a?.datumDurchfuhrung ?? "",
          festesDatum: a?.festesDatum ?? "",
          turnus: a?.turnus ?? "",
          turnusDetails: a?.turnusDetails ?? "",
          branchenspezifischeDetails: a?.branchenspezifischeDetails ?? "",
          preis: a?.preis ?? "",
          preisVorschlagErlaubt: a?.preisVorschlagErlaubt ?? true,
          status: a?.status ?? "offen",
          bilder: Array.isArray(a?.bilder) ? a.bilder : [],
        });
      } catch (e) {
        console.error(e);
        setError("Auftrag konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function removeBild(index) {
    setForm((f) => ({
      ...f,
      bilder: (f.bilder || []).filter((_, i) => i !== index),
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/auftraege/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Speichern fehlgeschlagen.");
        return;
      }
      router.push(`/auftrag/${id}`);
    } catch (e) {
      console.error(e);
      setError("Netzwerkfehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4">Lade Auftrag…</div>;

  return (
    <div className="w-full p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.back()}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
        >
          ← Zurück
        </button>
        <h1 className="text-xl font-bold">Auftrag bearbeiten</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="max-w-3xl space-y-4">
        {/* Titel */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Titel</label>
          <input
            type="text"
            value={form.titel}
            onChange={(e) => setField("titel", e.target.value)}
            className="w-full border rounded p-2"
            required
          />
        </div>

        {/* Beschreibung */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Beschreibung</label>
          <textarea
            rows={4}
            value={form.beschreibung}
            onChange={(e) => setField("beschreibung", e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Optionale Details zum Auftrag…"
          />
        </div>

        {/* Branche / Unterberuf */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Branche</label>
            <select
              value={form.branche}
              onChange={(e) => setField("branche", e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">— auswählen —</option>
              {BRANCHEN.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Unterberuf</label>
            <select
              value={form.unterberuf}
              onChange={(e) => setField("unterberuf", e.target.value)}
              className="w-full border rounded p-2"
              disabled={!form.branche}
            >
              <option value="">— auswählen —</option>
              {unterberufOptions.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Durchführung / festes Datum */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Durchführung</label>
            <select
              value={form.datumDurchfuhrung}
              onChange={(e) => setField("datumDurchfuhrung", e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">— auswählen —</option>
              {DURCHFUEHRUNG_PRESETS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Festes Datum</label>
            <input
              type="text"
              value={form.festesDatum}
              onChange={(e) => setField("festesDatum", e.target.value)}
              className="w-full border rounded p-2"
              placeholder="z. B. 31.08.2025"
            />
          </div>
        </div>

        {/* Turnus */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Turnus</label>
            <select
              value={form.turnus}
              onChange={(e) => setField("turnus", e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">— auswählen —</option>
              {TURNUS_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Turnus-Details</label>
            <input
              type="text"
              value={form.turnusDetails}
              onChange={(e) => setField("turnusDetails", e.target.value)}
              className="w-full border rounded p-2"
              placeholder='z. B. "Mo–Fr, 2h"'
            />
          </div>
        </div>

        {/* Preis / Vorschlag */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Preis / Budget</label>
            <input
              type="text"
              value={form.preis}
              onChange={(e) => setField("preis", e.target.value)}
              className="w-full border rounded p-2"
              placeholder='z. B. "120" oder "nach Vereinbarung"'
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="pve"
              type="checkbox"
              checked={!!form.preisVorschlagErlaubt}
              onChange={(e) => setField("preisVorschlagErlaubt", e.target.checked)}
            />
            <label htmlFor="pve" className="text-sm text-gray-700">
              Preisvorschläge erlauben
            </label>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
            className="w-full border rounded p-2"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Bilder Upload */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">Bilder hochladen</label>
          <BildManager
            bilder={form.bilder}
            onUploaded={(urls) =>
              setForm((f) => ({ ...f, bilder: [...(f.bilder || []), ...urls] }))
            }
            onRemove={removeBild}
          />
        </div>

        {/* Buttons */}
        <div className="pt-2 flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Speichern…" : "Speichern"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded border"
            onClick={() => router.push(`/auftrag/${id}`)}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}

function BildManager({ bilder = [], onUploaded, onRemove }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  async function handleUpload(selectedFiles = files) {
    if (!selectedFiles?.length) return;
    setUploading(true);
    setErr("");

    try {
      const formData = new FormData();
      for (const f of selectedFiles) formData.append("bilder", f);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setErr(data?.error || "Upload fehlgeschlagen.");
        return;
      }
      onUploaded?.(data.urls || []);
      setFiles([]);
    } catch (e) {
      console.error(e);
      setErr("Netzwerkfehler beim Upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="block"
        />
        <button
          type="button"
          onClick={() => handleUpload()}
          disabled={uploading || !files.length}
          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {uploading ? "Lade hoch…" : "Hochladen"}
        </button>
      </div>

      {err && <p className="text-sm text-red-600 mt-2">{err}</p>}

      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {bilder.map((u, i) => (
          <div key={i} className="border rounded p-2">
            <a href={u} target="_blank" rel="noreferrer">
              <img src={u} alt={`Bild ${i + 1}`} className="w-full h-28 object-cover rounded" />
            </a>
            <button
              type="button"
              className="mt-2 w-full px-2 py-1 rounded bg-red-600 text-white text-sm"
              onClick={() => onRemove(i)}
            >
              Entfernen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
