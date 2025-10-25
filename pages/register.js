import { useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { useUser } from '../context/UserContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    passwort: '',
    rolle: 'Auftraggeber',
  });

  const [message, setMessage] = useState('');
const router = useRouter();
const { setUser } = useUser();


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      rolle: formData.rolle.toLowerCase(),
    }),
  });

  const data = await res.json();

  if (res.ok) {
    Cookies.set("user", JSON.stringify(data.user), { expires: 7 });
    setUser(data.user);

    if (data.user.rolle === "dienstleister") {
      router.push("/dienstleister");
    } else {
      router.push("/dashboard");
    }
  } else {
    setMessage(data.message || 'Fehler bei der Registrierung.');
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Registrieren</h1>
        {message && (
          <div className="mb-4 text-center text-sm text-green-600">{message}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="email"
            name="email"
            placeholder="E-Mail"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            name="passwort"
            placeholder="Passwort"
            value={formData.passwort}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select
            name="rolle"
            value={formData.rolle}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Auftraggeber">Auftraggeber</option>
            <option value="Dienstleister">Dienstleister</option>
          </select>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Registrieren
          </button>
        </form>
      </div>
    </div>
  );
}
