import { useState } from "react";
import { useRouter } from "next/router";
import Cookies from "js-cookie";
import Link from "next/link";
import { useUser } from "../context/UserContext";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", passwort: "", rolle: "auftraggeber" });
  const [meldung, setMeldung] = useState("");
  const router = useRouter();
  const { setUser } = useUser();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...formData, rolle: formData.rolle.toLowerCase() }),
  });

  const data = await res.json();

  if (res.ok) {
    Cookies.set("user", JSON.stringify(data.user), { expires: 7 });
    setUser(data.user);

    // 🔁 Weiterleitung basierend auf der Rolle
    if (data.user.rolle === "dienstleister") {
      router.push("/dienstleister/dashboard");
    } else {
      router.push("/dashboard");
    }
  } else {
    setMeldung(data.message || "Fehler beim Login");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        {meldung && <p className="mb-4 text-center text-red-600">{meldung}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="E-Mail"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            autoComplete="email"
          />
          <input
            type="password"
            name="passwort"
            placeholder="Passwort"
            value={formData.passwort}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
            autoComplete="new-password"
          />
          <select
            name="rolle"
            value={formData.rolle}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded"
          >
            <option value="auftraggeber">Auftraggeber</option>
            <option value="dienstleister">Dienstleister</option>
          </select>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Einloggen
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/passwort-vergessen" className="text-blue-600 hover:underline">
            Passwort vergessen?
          </Link>
        </div>
      </div>
    </div>
  );
}
