import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) setVisible(true);
  }, []);

  const handleConsent = (type) => {
    localStorage.setItem("cookieConsent", type);
    setConsentGiven(true);
    setVisible(false);
  };

  if (!visible || consentGiven) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-5 md:max-w-3xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-800">
      <div className="flex-1">
        <p>
          Wir verwenden Cookies, um Inhalte zu personalisieren und die Zugriffe auf unsere Website zu analysieren.{" "}
          <Link href="/cookies" className="text-blue-600 underline hover:text-blue-800">
            Mehr erfahren
          </Link>
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => handleConsent("necessary")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded transition"
        >
          Nur notwendige
        </button>
        <button
          onClick={() => handleConsent("all")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
        >
          Alle akzeptieren
        </button>
      </div>
    </div>
  );
}
