import { useState } from "react";

export default function PasswortVergessen() {
  const [email, setEmail] = useState("");
  const [meldung, setMeldung] = useState("");
  const [sendenErfolgreich, setSendenErfolgreich] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMeldung("");

    const res = await fetch("/api/user/resetPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (res.ok) {
      setSendenErfolgreich(true);
    } else {
      setMeldung(data.message || "Fehler beim Senden");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Passwort vergessen</h1>
        {sendenErfolgreich ? (
          <p className="text-green-600 text-center">
            Wenn die E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {meldung && (
              <p className="text-red-600 text-center text-sm">{meldung}</p>
            )}
            <input
              type="email"
              placeholder="E-Mail-Adresse"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Zurücksetz-Link senden
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
