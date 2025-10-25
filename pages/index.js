import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "../context/UserContext";
import Link from "next/link";

export default function Home() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header mit Buttons rechts */}
      <header className="bg-white shadow px-4 py-4 flex justify-between items-center">
        <div /> {/* Platzhalter für linke Seite */}
        <div className="space-x-4">
          <Link href="/login" className="text-blue-600 hover:underline">
            Einloggen
          </Link>
          <Link
            href="/register"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Registrieren
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 bg-white text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Willkommen bei <span className="text-yellow-500">JobDropo</span>
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          <span className="italic text-yellow-600">Find. Match. Done.</span> <br />
          Die Plattform für spontane & einfache Auftragsvermittlung.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Jetzt einloggen
          </Link>
          <Link
            href="/register"
            className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded hover:bg-blue-50 transition"
          >
            Kostenlos registrieren
          </Link>
        </div>
      </section>

      {/* Vorteile */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Warum JobDropo?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-white p-6 rounded shadow hover:shadow-md transition">
              <div className="text-yellow-500 text-4xl mb-2">⚡</div>
              <h3 className="font-semibold text-lg mb-1">Blitzschnelle Vermittlung</h3>
              <p className="text-gray-600">
                Finde passende Aufträge oder Dienstleister innerhalb weniger Minuten.
              </p>
            </div>
            <div className="bg-white p-6 rounded shadow hover:shadow-md transition">
              <div className="text-yellow-500 text-4xl mb-2">🔒</div>
              <h3 className="font-semibold text-lg mb-1">Direkte Kommunikation</h3>
              <p className="text-gray-600">
                Datenschutzkonforme Chats und Kontakte in Echtzeit.
              </p>
            </div>
            <div className="bg-white p-6 rounded shadow hover:shadow-md transition">
              <div className="text-yellow-500 text-4xl mb-2">📊</div>
              <h3 className="font-semibold text-lg mb-1">Volle Kontrolle</h3>
              <p className="text-gray-600">
                Behalte alle Jobs, Angebote & Gespräche zentral im Blick.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Was unsere Nutzer sagen</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <blockquote className="bg-gray-50 p-6 rounded shadow">
              “Mit JobDropo finde ich innerhalb weniger Stunden neue Aufträge – top!”
              <footer className="mt-2 text-right text-sm text-gray-600">
                – Max M., Elektriker
              </footer>
            </blockquote>
            <blockquote className="bg-gray-50 p-6 rounded shadow">
              “Endlich eine Plattform, die wirklich einfach funktioniert – auch für kleine Teams.”
              <footer className="mt-2 text-right text-sm text-gray-600">
                – Laura H., Gebäudereinigerin
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-16">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Bereit, loszulegen?</h2>
          <p className="mb-6">
            Registriere dich kostenlos und starte sofort mit JobDropo durch.
          </p>
          <Link
            href="/register"
            className="bg-white text-blue-600 font-semibold px-6 py-3 rounded hover:bg-gray-100 transition"
          >
            Jetzt registrieren
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between text-sm">
          <p>© {new Date().getFullYear()} JobDropo – Alle Rechte vorbehalten</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <Link href="/impressum" className="hover:underline">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:underline">
              Datenschutz
            </Link>
            <Link href="/agb" className="hover:underline">
  AGB
</Link>
<Link href="/cookies" className="hover:underline">Cookie-Richtlinie</Link>
<Link href="/nutzung" className="hover:underline">Nutzungsbedingungen</Link>

          </div>
        </div>
      </footer>
    </div>
  );
}
