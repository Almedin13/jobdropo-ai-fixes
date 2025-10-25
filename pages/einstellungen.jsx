import { useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "../context/UserContext";

export default function Einstellungen() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [passwortAlt, setPasswortAlt] = useState("");
  const [passwortNeu, setPasswortNeu] = useState("");
  const [meldung, setMeldung] = useState("");
  const [meldung, setMeldung] = useState("");

const [benachrichtigungen, setBenachrichtigungen] = useState({
  email: false,
  push: false,
});

  if (!user) {
    return <p>Lade Benutzerdaten...</p>;
  }

const handlePasswortAendern = async (e) => {
  e.preventDefault();
  const res = await fetch("/api/user/changePassword", {  // ← Pfad angepasst
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

    const res = await fetch("/api/user/loeschen", {
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
{/* Benachrichtigungen */}
<div className="mb-8">
  <h2 className="text-xl font-semibold mb-4">Benachrichtigungen</h2>

  <div className="flex items-center justify-between mb-2">
    <span>E-Mail-Benachrichtigungen</span>
    <input
      type="checkbox"
      checked={benachrichtigungen.email}
      onChange={() =>
        setBenachrichtigungen((prev) => ({
          ...prev,
          email: !prev.email,
        }))
      }
      className="w-5 h-5"
    />
  </div>

  <div className="flex items-center justify-between">
    <span>Push-Benachrichtigungen</span>
    <input
      type="checkbox"
      checked={benachrichtigungen.push}
      onChange={() =>
        setBenachrichtigungen((prev) => ({
          ...prev,
          push: !prev.push,
        }))
      }
      className="w-5 h-5"
    />
  </div>
</div>

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 bg-white shadow-md rounded">
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

      {/* Benachrichtigungen */}
<div className="mb-8">
  <h2 className="text-xl font-semibold mb-4">Benachrichtigungen</h2>
  <label className="flex items-center space-x-2 mb-2">
    <input
      type="checkbox"
      checked={benachrichtigungen.email}
      onChange={(e) =>
        setBenachrichtigungen((prev) => ({ ...prev, email: e.target.checked }))
      }
      className="accent-blue-600"
    />
    <span>E-Mail-Benachrichtigungen</span>
  </label>
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={benachrichtigungen.push}
      onChange={(e) =>
        setBenachrichtigungen((prev) => ({ ...prev, push: e.target.checked }))
      }
      className="accent-blue-600"
    />
    <span>Push-Benachrichtigungen</span>
  </label>
</div>


