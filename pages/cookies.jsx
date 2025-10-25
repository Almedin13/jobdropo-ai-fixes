import { useRouter } from "next/router";

export default function Cookies() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-gray-800 px-6 py-12">
      <button
        onClick={() => router.back()}
        className="mb-8 bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
      >
        Zurück
      </button>

      <h1 className="text-3xl font-bold mb-6">Cookie-Richtlinie</h1>

      <p>
        Unsere Website verwendet Cookies. Das sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden,
        um bestimmte Funktionen zu ermöglichen oder die Nutzung der Seite zu analysieren.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Notwendige Cookies</h2>
      <p>
        Diese Cookies sind erforderlich, damit die Website korrekt funktioniert, z. B. zur Navigation oder
        zur Speicherung Ihrer Logins.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Analyse- und Tracking-Cookies</h2>
      <p>
        Mit Ihrer Zustimmung setzen wir Cookies ein, um das Nutzerverhalten zu analysieren und unsere Dienste zu verbessern.
        Diese Daten werden anonymisiert gespeichert.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Cookie-Einstellungen ändern</h2>
      <p>
        Sie können Ihre Cookie-Einstellungen jederzeit in den Browsereinstellungen oder über unseren Cookie-Banner anpassen.
      </p>

      <p className="mt-4">
        Weitere Informationen finden Sie in unserer <a href="/datenschutz" className="text-blue-600 hover:underline">Datenschutzerklärung</a>.
      </p>
    </div>
  );
}
