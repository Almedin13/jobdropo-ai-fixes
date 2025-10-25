import { useRouter } from "next/router";

export default function AGB() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-gray-800 px-6 py-12">
      <button
        onClick={() => router.back()}
        className="mb-8 bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
      >
        Zurück
      </button>

      <h1 className="text-3xl font-bold mb-6">Allgemeine Geschäftsbedingungen (AGB)</h1>

      <h2 className="text-xl font-semibold mt-4 mb-2">1. Geltungsbereich</h2>
      <p>
        Diese Allgemeinen Geschäftsbedingungen gelten für alle Nutzer der Plattform JobDropo.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">2. Leistungen von JobDropo</h2>
      <p>
        JobDropo bietet eine Plattform zur Vermittlung von Aufträgen zwischen Auftraggebern und Dienstleistern.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">3. Registrierung</h2>
      <p>
        Die Nutzung der Plattform erfordert eine Registrierung. Die bei der Registrierung gemachten Angaben müssen vollständig und wahrheitsgemäß sein.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">4. Pflichten der Nutzer</h2>
      <p>
        Nutzer verpflichten sich, keine rechtswidrigen Inhalte einzustellen und die Plattform nicht missbräuchlich zu nutzen.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">5. Haftung</h2>
      <p>
        JobDropo haftet nicht für die Qualität der vermittelten Dienstleistungen. Die Plattform übernimmt keine Gewährleistung für abgeschlossene Verträge zwischen Nutzern.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">6. Schlussbestimmungen</h2>
      <p>
        Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Stuttgart.
      </p>
    </div>
  );
}
