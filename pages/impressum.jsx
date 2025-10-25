import { useRouter } from "next/router";

export default function Impressum() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-gray-800 px-6 py-12">
      <button
        onClick={() => router.back()}
        className="mb-8 bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
      >
        Zurück
      </button>

      <h1 className="text-3xl font-bold mb-4">Impressum</h1>
      <p className="mb-2 font-semibold">Angaben gemäß § 5 TMG:</p>

      <p>
        AAS Dienstleistungen<br />
        Almedin Salihovic<br />
        Suttnerstraße 12<br />
        70437 Stuttgart<br />
        Deutschland
      </p>

      <p className="mt-4">Umsatzsteuer-ID: DE327117747</p>

      <p className="mt-4">
        <strong>Kontakt:</strong><br />
        Telefon: +49 (0)30 1234567<br />
        E-Mail: info@aas-dienstleistungen.com<br />
        Website: www.jobdropo.com
      </p>

      <p className="mt-6">
        <strong>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</strong><br />
        Almedin Salihovic<br />
        Suttnerstraße 12<br />
        70437 Stuttgart
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <br />
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" className="text-blue-600 hover:underline">https://ec.europa.eu/consumers/odr</a><br />
        Unsere E-Mail-Adresse finden Sie oben im Impressum.
      </p>
      <p className="mt-2">
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </div>
  );
}
