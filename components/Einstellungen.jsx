import { useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "../context/UserContext";

export default function Einstellungen() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [passwortAlt, setPasswortAlt] = useState("");
  const [passwortNeu, setPasswortNeu] = useState("");
  const [meldung, setMeldung] = useState("");

  if (!user) {
    return <p>Lade Benutzerdaten...</p>;
  }

  const handlePasswortAendern = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/user/changePassword", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        passwortAlt,
        passwortNeu,
      }),
    });

    const data = await res.json();
    setMeldung(data.message);
    if (res.ok) {
      setPasswortAlt("");
      setPasswortNeu("");
    }
  };

  const handleKontoLoeschen = async () => {
    if (!confirm("Bist du sicher, dass du dein Konto löschen willst?")) return;

    const res = await fetch("/api/user/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });

    if (res.ok) {
      setUser(null);
      router.push("/login");
    } else {
      const data = await res.json();
      setMeldung(data.message || "Fehler beim Löschen");
    }
  };

  return (
    <div className="w-full py-8 px-8 bg-white shadow-md rounded">
      <h1 className="text-2xl font-bold mb-6">Einstellungen</h1>

      {meldung && (
        <div className="mb-4 text-center text-sm text-red-600">{meldung}</div>
      )}

      {/* Passwort ändern */}
      <form onSubmit={handlePasswortAendern} className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Passwort ändern</h2>
        <input
          type="password"
          placeholder="Aktuelles Passwort"
          value={passwortAlt}
          onChange={(e) => setPasswortAlt(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Neues Passwort"
          value={passwortNeu}
          onChange={(e) => setPasswortNeu(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Passwort ändern
        </button>
      </form>

      {/* Konto löschen */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Konto löschen</h2>
        <button
          onClick={handleKontoLoeschen}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Konto dauerhaft löschen
        </button>
      </div>

      {/* Platz für Benachrichtigungen */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Benachrichtigungen</h2>
        <p className="text-gray-500">E-Mail & Push-Benachrichtigungen – bald verfügbar.</p>
      </div>

      {/* Platz für Einladung */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Nutzer einladen</h2>
        <p className="text-gray-500">Teile bald deinen individuellen Einladungslink.</p>
      </div>
    </div>
  );
}
