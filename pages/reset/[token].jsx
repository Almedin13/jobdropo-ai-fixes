// pages/reset/[token].jsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [passwortNeu, setPasswortNeu] = useState("");
  const [meldung, setMeldung] = useState("");
  const [tokenGueltig, setTokenGueltig] = useState(false);
  const [geprueft, setGeprueft] = useState(false);

  useEffect(() => {
    async function pruefeToken() {
      if (!token) return;
      const res = await fetch(`/api/user/reset/checkToken?token=${token}`);
      const data = await res.json();
      setTokenGueltig(res.ok);
      setGeprueft(true);
      if (!res.ok) {
        setMeldung(data.message || "Ungültiger oder abgelaufener Link");
      }
    }
    pruefeToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/user/resetPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, neuesPasswort: passwortNeu }),
    });
    const data = await res.json();
    setMeldung(data.message);

    if (res.ok) {
      setTimeout(() => router.push("/login"), 3000);
    }
  };

  if (!geprueft) {
    return <p>Prüfe Link...</p>;
  }

  if (!tokenGueltig) {
    return <p className="text-center text-red-600 mt-10">{meldung}</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Neues Passwort setzen</h1>
        {meldung && <p className="mb-4 text-center text-red-600">{meldung}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Neues Passwort"
            value={passwortNeu}
            onChange={(e) => setPasswortNeu(e.target.value)}
            className="w-full px-4 py-2 border rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Passwort speichern
          </button>
        </form>
      </div>
    </div>
  );
}
