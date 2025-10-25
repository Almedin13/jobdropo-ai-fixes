import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router";
import AuftraggeberLayout from "../../components/layouts/AuftraggeberLayout";

export default function ProfilPage() {
  const { user } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  // Zugriffsschutz
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user !== undefined && user.rolle !== "auftraggeber") {
      router.push("/dienstleister/dashboard");
    }
  }, [user, router]);

  // Profil laden (mit E-Mail-Filter)
  useEffect(() => {
    if (!user?.email) return;

    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch(`/api/profil?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();

        // 🧠 Fallback, falls alte Struktur (nur "name")
        const nameParts = (data.name || "").trim().split(" ");
        const updated = {
          ...data,
          vorname: data.vorname || nameParts[0] || "",
          nachname: data.nachname || nameParts.slice(1).join(" ") || "",
          email: data.email || user.email || "",
        };

        setUserData(updated);
        setFormData(updated);
      } catch (err) {
        console.error("Fehler beim Laden des Profils:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  // Formularänderungen
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Speichern
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const updatedData = {
        ...formData,
        name: `${formData.vorname || ""} ${formData.nachname || ""}`.trim(),
        email: formData.email || user.email,
      };

      const res = await fetch("/api/profil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        alert("✅ Profil erfolgreich gespeichert!");
        setUserData(updatedData);
      } else {
        alert("❌ Fehler beim Speichern des Profils.");
      }
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("⚠️ Speichern fehlgeschlagen.");
    }
  };

  if (!user) return <p className="text-center mt-10">Bitte einloggen...</p>;
  if (loading) return <p className="text-center mt-10">Lade Profil...</p>;

  return (
    <AuftraggeberLayout>
      <h1 className="text-2xl font-bold mb-4">Mein Profil</h1>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl shadow p-6 max-w-3xl space-y-5"
      >
        {/* 🧍 Persönliche Daten */}
        <h2 className="text-lg font-semibold border-b pb-1 mb-3">
          Profil bearbeiten
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">Vorname</label>
            <input
              type="text"
              name="vorname"
              value={formData.vorname || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
              placeholder="z. B. Almedin"
              required
            />
          </div>

          <div>
            <label className="block font-semibold">Nachname</label>
            <input
              type="text"
              name="nachname"
              value={formData.nachname || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
              placeholder="z. B. Salihovic"
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mt-2">E-Mail</label>
          <input
            type="email"
            name="email"
            value={formData.email || ""}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="z. B. name@email.de"
            required
          />
        </div>

        <div>
          <label className="block font-semibold mt-2">Telefon</label>
          <input
            type="text"
            name="telefon"
            value={formData.telefon || ""}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="z. B. 0176 4206 8085"
          />
        </div>

        <div>
          <label className="block font-semibold mt-2">Firma</label>
          <input
            type="text"
            name="firma"
            value={formData.firma || ""}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="z. B. AAS Dienstleistungen"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mt-2">Straße & Hausnummer</label>
            <input
              type="text"
              name="strasse"
              value={formData.strasse || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block font-semibold mt-2">Postleitzahl</label>
            <input
              type="text"
              name="plz"
              value={formData.plz || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mt-2">Stadt</label>
          <input
            type="text"
            name="stadt"
            value={formData.stadt || ""}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        {/* 💳 Bankverbindung */}
        <h2 className="text-lg font-semibold border-b pb-1 mt-6 mb-3">
          Bankverbindung
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold">IBAN</label>
            <input
              type="text"
              name="iban"
              value={formData.iban || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block font-semibold">BIC</label>
            <input
              type="text"
              name="bic"
              value={formData.bic || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
        >
          Speichern
        </button>
      </form>
    </AuftraggeberLayout>
  );
}
