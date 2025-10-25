import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "../../context/UserContext";
import AuftraggeberLayout from "../../components/layouts/AuftraggeberLayout";

export default function Einstellungen() {
  const { user } = useUser();
  const router = useRouter();

  // 🔒 Zugriffsschutz
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user !== undefined && user.rolle !== "auftraggeber") {
      router.push("/dienstleister/dashboard");
    }
  }, [user, router]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage("❌ Neue Passwörter stimmen nicht überein");
      return;
    }

    const res = await fetch("/api/user/changePassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    setMessage(data.message);
  };

  const handleDeleteAccount = async () => {
    const res = await fetch("/api/user/delete", {
      method: "DELETE",
    });

    const data = await res.json();
    setDeleteMessage(data.message || "Konto wurde zur Löschung markiert.");
  };

  if (!user) return <p className="text-center mt-10">Bitte einloggen...</p>;

  return (
    <AuftraggeberLayout>
      <h1 className="text-2xl font-bold mb-4">Einstellungen</h1>

      {/* Passwort ändern */}
      <div className="p-6 max-w-md bg-white rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">🔒 Passwort ändern</h2>

        <input
          type="password"
          placeholder="Aktuelles Passwort"
          className="w-full p-2 border rounded mb-2"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Neues Passwort"
          className="w-full p-2 border rounded mb-2"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Neues Passwort wiederholen"
          className="w-full p-2 border rounded mb-4"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={handlePasswordChange}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Passwort ändern
        </button>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>

      {/* Konto löschen */}
      <div className="p-6 max-w-md bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Konto löschen</h2>

        <p className="text-sm mb-4 text-gray-600">
          Dein Konto wird nach dem Klick archiviert und automatisch in 2 Monaten gelöscht – es sei denn, es bestehen noch offene Rechnungen.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Konto löschen
          </button>
        ) : (
          <div>
            <p className="mb-2 text-sm text-red-700">
              Bist du sicher? Dieser Schritt kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleDeleteAccount}
                className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800"
              >
                Ja, Konto löschen
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {deleteMessage && <p className="mt-4 text-sm text-green-600">{deleteMessage}</p>}
      </div>
    </AuftraggeberLayout>
  );
}
