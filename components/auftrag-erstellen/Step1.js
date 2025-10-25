import { useEffect } from "react";
import { Calendar, MapPin, Phone, FileText, Image as ImageIcon, ClipboardList } from "lucide-react";

const branchenMitUnterberufen = {
  "Handwerk": ["Maurer", "Elektriker", "Zimmerer", "Maler und Lackierer", "Installateur", "Fliesenleger", "Dachdecker", "Tischler", "Klempner", "Schreiner", "Heizungsbauer", "Sanitärinstallateur", "Bodenleger", "Glaser", "Schlosser", "Metallbauer", "Schweißer", "Raumausstatter", "Trockenbauer", "Gerüstbauer"],
  "Gastronomie": ["Koch", "Kellner", "Barkeeper", "Restaurantleiter", "Küchenhilfe", "Barista", "Sommelier", "Servicekraft", "Buffetkraft", "Pâtissier", "Küchenchef", "Caterer", "Event-Koch", "Geschirrspüler"],
  "Reinigung": ["Gebäudereiniger", "Fensterputzer", "Büroreinigungskraft", "Hausmeister", "Industriereiniger", "Teppichreiniger", "Fassadenreiniger", "Reinigungsfachkraft", "Sanitärreiniger"],
  "IT & Software": ["Softwareentwickler", "Systemadministrator", "Datenanalyst", "IT-Support", "DevOps Engineer", "Webentwickler", "Datenbankadministrator", "Cybersecurity-Spezialist", "IT-Berater", "Netzwerktechniker", "App-Entwickler", "QA-Tester"],
  "Gesundheit": ["Pflegekraft", "Arzt", "Physiotherapeut", "Apotheker", "Medizinischer Assistent", "Ergotherapeut", "Zahnarzt", "Hebamme", "Psychologe", "Sanitäter"],
  "Bildung": ["Lehrer", "Erzieher", "Trainer", "Dozent", "Nachhilfelehrer", "Schulassistent", "Bildungsberater", "Pädagoge", "Sozialpädagoge"],
  "Marketing": ["Social Media Manager", "Content Creator", "SEO-Spezialist", "Grafikdesigner", "PR-Berater", "Werbetexter", "Eventmanager", "Marktforscher", "Brand Manager", "Online-Marketing-Manager", "Fotograf"],
  "Logistik": ["Fahrer", "Lagerist", "Versandmitarbeiter", "Disponent", "Fuhrparkmanager", "Logistikplaner", "Staplerfahrer", "Logistikkoordinator"],
  "Gesundheit & Pflege": ["Altenpfleger", "Krankenpfleger", "Arzt", "Apotheker", "Sanitäter", "Hausarzt", "Pflegedienstleiter", "Heilpraktiker", "Pflegehelfer"],
  "Bau & Architektur": ["Architekt", "Bauingenieur", "Statiker", "Baustellenleiter", "Bauzeichner", "Tiefbauer", "Geologe", "Landschaftsarchitekt"],
  "Verkauf & Einzelhandel": ["Verkäufer", "Kassierer", "Filialleiter", "Lagerist", "Einkäufer", "Merchandiser", "Verkaufsberater", "Kundenberater"],
  "Kreative Berufe": ["Fotograf", "Illustrator", "Maler", "Designer", "Texter", "Filmemacher", "Modedesigner", "Bildhauer"]
};

const datumOptionen = ["Diese Woche", "Nächste Woche", "Dieser Monat", "Konkreter Zeitraum (Start- und Enddatum)"];
const turnusOptionen = ["Einmalig", "Täglich", "Wöchentlich", "Zweiwöchentlich", "Monatlich", "Jährlich"];

export default function Step1({ formData, setFormData, onNext }) {
  const unterberufe = formData?.branche ? branchenMitUnterberufen[formData.branche] || [] : [];

  const getWeekRange = (offset = 0) => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { start: monday, end: sunday };
  };

  const getMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  };

  const formatDate = (date) =>
    date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  useEffect(() => {
    if (formData.unterberuf) {
      setFormData((prev) => ({
        ...prev,
        titel: `Anfrage ${prev.unterberuf}`
      }));
    }
  }, [formData.unterberuf]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "datumDurchfuehrung") {
      let startDatum = "";
      let endDatum = "";
      let anzeigeText = "";

      if (value === "Diese Woche") {
        const { start, end } = getWeekRange(0);
        startDatum = formatDate(start);
        endDatum = formatDate(end);
        anzeigeText = `Diese Woche (${startDatum} – ${endDatum})`;
      } else if (value === "Nächste Woche") {
        const { start, end } = getWeekRange(1);
        startDatum = formatDate(start);
        endDatum = formatDate(end);
        anzeigeText = `Nächste Woche (${startDatum} – ${endDatum})`;
      } else if (value === "Dieser Monat") {
        const { start, end } = getMonthRange();
        startDatum = formatDate(start);
        endDatum = formatDate(end);
        anzeigeText = `Dieser Monat (${startDatum} – ${endDatum})`;
      }

      setFormData({
        ...formData,
        datumDurchfuehrung: value,
        startDatum,
        endDatum,
        anzeigeText
      });
    } else if (name === "branche") {
      setFormData({ ...formData, branche: value, unterberuf: "", titel: "" });
    } else if (name === "bilder") {
      const filesArray = Array.from(files);
      Promise.all(
        filesArray.map(file => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      ).then(base64Images => {
        setFormData(prev => ({
          ...prev,
          bilder: base64Images
        }));
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white shadow-md rounded-2xl p-6 space-y-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center gap-2">
        <ClipboardList className="text-blue-600" size={26} />
        Schritt 1: Auftragsdetails
      </h2>

      <div className="space-y-4">
        <label className="block font-semibold text-gray-700">Titel</label>
        <input
          type="text"
          name="titel"
          value={formData.titel || ""}
          readOnly
          className="w-full p-2 border rounded bg-gray-100 text-gray-700 cursor-not-allowed"
        />

        <label className="block font-semibold text-gray-700">Branche</label>
        <select
          name="branche"
          value={formData?.branche || ""}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Bitte wählen</option>
          {Object.keys(branchenMitUnterberufen).map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {unterberufe.length > 0 && (
          <>
            <label className="block font-semibold text-gray-700">Unterberuf</label>
            <select
              name="unterberuf"
              value={formData?.unterberuf || ""}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            >
              <option value="">Bitte wählen</option>
              {unterberufe.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </>
        )}

        <div>
          <label className="block font-semibold text-gray-700 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" /> Datum der Durchführung
          </label>
          <select
            name="datumDurchfuehrung"
            value={formData?.datumDurchfuehrung || ""}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded mt-1"
          >
            <option value="">Bitte wählen</option>
            {datumOptionen.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {formData.datumDurchfuehrung === "Konkreter Zeitraum (Start- und Enddatum)" && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input type="date" name="startDatum" value={formData?.startDatum || ""} onChange={handleChange} required className="p-2 border rounded" />
              <input type="date" name="endDatum" value={formData?.endDatum || ""} onChange={handleChange} required className="p-2 border rounded" />
            </div>
          )}
        </div>

        <label className="block font-semibold text-gray-700">Turnus</label>
        <select
          name="turnus"
          value={formData?.turnus || ""}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Bitte wählen</option>
          {turnusOptionen.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <div>
          <label className="block font-semibold text-gray-700 flex items-center gap-2 mt-2">
            <MapPin size={18} className="text-blue-600" /> Standort
          </label>
          <input type="text" name="strasse" placeholder="Straße & Hausnummer" value={formData?.strasse || ""} onChange={handleChange} className="w-full p-2 border rounded mt-1" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input type="text" name="plz" placeholder="PLZ" value={formData?.plz || ""} onChange={handleChange} className="p-2 border rounded" />
            <input type="text" name="ort" placeholder="Ort" value={formData?.ort || ""} onChange={handleChange} className="p-2 border rounded" />
          </div>
        </div>

        <label className="block font-semibold text-gray-700 flex items-center gap-2 mt-4">
          <Phone size={18} className="text-blue-600" /> Telefonnummer
        </label>
        <input type="tel" name="telefon" placeholder="z. B. 0176 12345678" value={formData?.telefon || ""} onChange={handleChange} required className="w-full p-2 border rounded" />

        <label className="block font-semibold text-gray-700 flex items-center gap-2 mt-4">
          <FileText size={18} className="text-blue-600" /> Beschreibung
        </label>
        <textarea name="beschreibung" placeholder="Beschreibung oder Details" value={formData?.beschreibung || ""} onChange={handleChange} className="w-full p-2 border rounded" />

        <label className="block font-semibold text-gray-700 flex items-center gap-2 mt-4">
          <ImageIcon size={18} className="text-blue-600" /> Bilder hochladen (optional)
        </label>
        <input type="file" name="bilder" multiple onChange={handleChange} className="w-full" />
      </div>

      <button
        type="submit"
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold shadow hover:bg-blue-700 transition-all"
      >
        Weiter zu Schritt 2
      </button>
    </form>
  );
}
