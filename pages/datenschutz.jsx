import { useRouter } from "next/router";

export default function Datenschutz() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-gray-800 px-6 py-12">
      <button
        onClick={() => router.back()}
        className="mb-8 bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
      >
        Zurück
      </button>

      <h1 className="text-3xl font-bold mb-6">Datenschutzerklärung</h1>
      <p>
        Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre Daten daher ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TMG). In diesen Datenschutzinformationen informieren wir Sie über die wichtigsten Aspekte der Datenverarbeitung im Rahmen unserer Website.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Kontakt mit uns</h2>
      <p>
        Wenn Sie per Formular auf der Website oder per E-Mail Kontakt mit uns aufnehmen, werden Ihre angegebenen Daten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen sechs Monate bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Cookies</h2>
      <p>
        Unsere Website verwendet sogenannte Cookies. Dabei handelt es sich um kleine Textdateien, die mit Hilfe des Browsers auf Ihrem Endgerät abgelegt werden. Sie richten keinen Schaden an.
      </p>
      <p>
        Wir nutzen Cookies dazu, unser Angebot nutzerfreundlich zu gestalten. Einige Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese löschen. Sie ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Ihre Rechte</h2>
      <p>
        Ihnen stehen grundsätzlich die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerruf und Widerspruch zu. Wenn Sie glauben, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt, können Sie sich bei der Aufsichtsbehörde beschweren.
      </p>
    </div>
  );
}
