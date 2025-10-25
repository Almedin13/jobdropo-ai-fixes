import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

export default function Profil() {
  const { user } = useUser();
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchProfil() {
      if (!user || !user.email) return;
      try {
        const res = await fetch(`/api/profil?email=${encodeURIComponent(user.email)}`);
        if (!res.ok) throw new Error("Fehler beim Laden");

        const data = await res.json();
        setFormData({
          name: data.name || "",
          email: data.email || "",
          telefon: data.telefon || "",
          firma: data.firma || "",
          strasse: data.strasse || "",
          hausnummer: data.hausnummer || "",
          plz: data.plz || "",
          stadt: data.stadt || "",
          iban: data.iban || "",
          bic: data.bic || "",
          ustId: data.ustId || "",
        });
      } catch (err) {
        console.error("Fehler beim Laden des Profils:", err);
      }
    }

    fetchProfil();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/profil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert("Fehler beim Speichern");
      }
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      alert("Netzwerkfehler");
    }
  };

  return (
    <div className="w-full px-8 py-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-6">Profil bearbeiten</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label className="block mb-1 font-medium">E-Mail</label>
          <input name="email" value={formData.email} onChange={handleChange} className="w-full border p-2 rounded" disabled />
        </div>
        <div>
          <label className="block mb-1 font-medium">Telefon</label>
          <input name="telefon" value={formData.telefon} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Firma</label>
          <input name="firma" value={formData.firma} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Straße</label>
            <input name="strasse" value={formData.strasse} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Hausnummer</label>
            <input name="hausnummer" value={formData.hausnummer} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Postleitzahl</label>
            <input name="plz" value={formData.plz} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Stadt</label>
            <input name="stadt" value={formData.stadt} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <hr className="my-4" />
        <h3 className="text-xl font-semibold">Bankverbindung</h3>
        <div>
          <label className="block mb-1 font-medium">IBAN</label>
          <input name="iban" value={formData.iban} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 font-medium">BIC</label>
          <input name="bic" value={formData.bic} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 font-medium">USt-ID</label>
          <input name="ustId" value={formData.ustId} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Speichern
        </button>
        {saved && <p className="text-green-600 mt-2">Profil erfolgreich gespeichert.</p>}
      </form>
    </div>
  );
}
