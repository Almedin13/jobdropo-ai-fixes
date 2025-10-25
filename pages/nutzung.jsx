import { useRouter } from "next/router";

export default function Nutzungsbedingungen() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-gray-800 px-6 py-12">
      <button
        onClick={() => router.back()}
        className="mb-8 bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
      >
        Zurück
      </button>

      <h1 className="text-3xl font-bold mb-6">Nutzungsbedingungen</h1>

      <h2 className="text-xl font-semibold mt-4 mb-2">1. Allgemeines</h2>
      <p>
        Mit der Nutzung unserer Plattform erklären Sie sich mit den nachfolgenden Nutzungsbedingungen einverstanden.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">2. Leistungsbeschreibung</h2>
      <p>
        JobDropo vermittelt Aufträge zwischen Auftraggebern und Dienstleistern, übernimmt aber keine Gewährleistung
        für den Erfolg oder die Qualität der durchgeführten Leistungen.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">3. Registrierung</h2>
      <p>
        Für die vollständige Nutzung der Plattform ist eine Registrierung erforderlich. Nutzer sind verpflichtet,
        wahrheitsgemäße Angaben zu machen.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">4. Pflichten der Nutzer</h2>
      <p>
        Nutzer verpflichten sich, keine gesetzeswidrigen Inhalte einzustellen und die Plattform nicht für illegale Zwecke zu verwenden.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">5. Haftung</h2>
      <p>
        JobDropo haftet nicht für Inhalte, die von Nutzern bereitgestellt werden, noch für Schäden, die aus der Nutzung der Plattform entstehen.
      </p>

      <h2 className="text-xl font-semibold mt-4 mb-2">6. Schlussbestimmungen</h2>
      <p>
        Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Stuttgart, soweit gesetzlich zulässig.
      </p>
    </div>
  );
}
