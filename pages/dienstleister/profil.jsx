import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import DienstleisterLayout from "../../components/layouts/DienstleisterLayout";
import { useUser } from "../../context/UserContext";

const PROFILE_API = "/api/dienstleister/profil";

export default function ProfilSeite() {
  const userCtx = useUser() || {};
  const { user, setUser } = userCtx;
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telefon: "",
    firma: "",
    strasse: "",
    hausnummer: "",
    plz: "",
    stadt: "",
    iban: "",
    bic: "",
    ustId: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // ⛔ Zugriff nur für eingeloggt + richtige Rolle
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user !== undefined && user?.rolle !== "dienstleister") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Profil laden (Backend) + mit User-Objekt mergen
  useEffect(() => {
    if (!user?._id) return;

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError("");
      setSaved(false);
      try {
        const url = new URL(window.location.origin + PROFILE_API);
        url.searchParams.set("dienstleisterId", user._id);

        const res = await fetch(url.toString(), { signal: controller.signal });
        const data = res.ok ? await res.json() : null;

        const initial = {
          name: user.name || "",
          email: user.email || "",
          telefon: data?.telefon || "",
          firma: data?.firma || "",
          strasse: data?.strasse || "",
          hausnummer: data?.hausnummer || "",
          plz: data?.plz || "",
          stadt: data?.stadt || "",
          iban: data?.iban || "",
          bic: data?.bic || "",
          ustId: data?.ustId || "",
        };
        setFormData(initial);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setError("Profil konnte nicht geladen werden.");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [user?._id, user?.name, user?.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) return;

    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(PROFILE_API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dienstleisterId: user._id,
          ...formData,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Fehler (${res.status}): ${t || "Unbekannter Fehler"}`);
      }

      const savedProfile = await res.json();

      // Kontext aktualisieren (falls dein Context das unterstützt)
      if (typeof setUser === "function") {
        setUser((prev) => ({
          ...prev,
          name: formData.name || prev?.name,
          email: formData.email || prev?.email,
          // Optional: falls du Teile im User-Objekt mitführen willst:
          telefon: formData.telefon || prev?.telefon,
          firma: formData.firma || prev?.firma,
          strasse: formData.strasse || prev?.strasse,
          hausnummer: formData.hausnummer || prev?.hausnummer,
          plz: formData.plz || prev?.plz,
          stadt: formData.stadt || prev?.stadt,
          iban: formData.iban || prev?.iban,
          bic: formData.bic || prev?.bic,
          ustId: formData.ustId || prev?.ustId,
        }));
      }

      setSaved(true);
    } catch (e) {
      console.error(e);
      setError(e.message || "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <p className="text-center mt-10">Bitte einloggen...</p>;
  if (loading) return <p className="text-center mt-10">Profil wird geladen…</p>;

  return (
    <DienstleisterLayout title="Profil bearbeiten">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Meldungen */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3">
            {error}
          </div>
        )}
        {saved && !error && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3">
            Profil gespeichert.
          </div>
        )}

        {/* Stammdaten */}
        <section>
          <h2 className="text-lg font-bold mb-4">Stammdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Name</label>
              <input name="name" value={formData.name} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">E-Mail</label>
              <input name="email" value={formData.email} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Telefon</label>
              <input name="telefon" value={formData.telefon} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Firma</label>
              <input name="firma" value={formData.firma} onChange={handleChange} className="input" />
            </div>
          </div>
        </section>

        {/* Adresse */}
        <section>
          <h2 className="text-lg font-bold mt-6 mb-4">Adresse</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Straße</label>
              <input name="strasse" value={formData.strasse} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">Hausnummer</label>
              <input name="hausnummer" value={formData.hausnummer} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">PLZ</label>
              <input name="plz" value={formData.plz} onChange={handleChange} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Stadt</label>
              <input name="stadt" value={formData.stadt} onChange={handleChange} className="input" />
            </div>
          </div>
        </section>

        {/* Bank */}
        <section>
          <h2 className="text-lg font-bold mt-6 mb-4">Bankverbindung</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">IBAN</label>
              <input name="iban" value={formData.iban} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="block font-semibold mb-1">BIC</label>
              <input name="bic" value={formData.bic} onChange={handleChange} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">USt-ID</label>
              <input name="ustId" value={formData.ustId} onChange={handleChange} className="input" />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Speichert…" : "Speichern"}
        </button>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #e5e7eb; /* gray-200 */
          border-radius: 0.75rem;    /* xl */
          background: white;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25); /* blue-500/25 */
          border-color: #93c5fd; /* blue-300 */
        }
      `}</style>
    </DienstleisterLayout>
  );
}
