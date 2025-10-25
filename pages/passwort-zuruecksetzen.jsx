import { useState } from "react";
import { useRouter } from "next/router";

export default function PasswortZuruecksetzen() {
  const router = useRouter();
  const { token } = router.query;
  const [passwort, setPasswort] = useState("");
  const [meldung, setMeldung] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/user/resetPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, neuesPasswort: passwort }),
    });
    const data = await res.json();
    setMeldung(data.message);
    if (res.ok) setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Neues Passwort</h1>
        {meldung && <p className="mb-4 text-center text-green-600">{meldung}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Neues Passwort"
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
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
