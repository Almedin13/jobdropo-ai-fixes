import { useState, useEffect } from "react";
import DienstleisterLayout from "../../components/layouts/DienstleisterLayout";
import { useUser } from "../../context/UserContext";
import { useRouter } from "next/router";

export default function Einstellungen() {
  const { user, setUser } = useUser();
  const router = useRouter();

  // ⛔ Zugriffsschutz
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user !== undefined && user.rolle !== "dienstleister") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwFeedback, setPwFeedback] = useState("");

  const [notificationEmail, setNotificationEmail] = useState(true);
  const [notificationPush, setNotificationPush] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPwFeedback("❌ Neue Passwörter stimmen nicht überein.");
      return;
    }

    try {
      const res = await fetch("/api/user/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPwFeedback("✅ Passwort erfolgreich geändert.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error) {
      setPwFeedback("❌ Fehler: " + error.message);
    }
  };

  const handleKontoLoeschen = async () => {
    if (!confirm("Möchtest du dein Konto wirklich löschen? Es wird für 2 Monate archiviert.")) return;

    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (res.ok) {
        alert("Dein Konto wurde archiviert und wird in 2 Monaten endgültig gelöscht.");
        setUser(null);
        router.push("/login");
      } else {
        alert("Fehler beim Archivieren.");
      }
    } catch (error) {
      console.error("Fehler beim Archivieren:", error);
      alert("Ein Fehler ist aufgetreten.");
    }
  };

  return (
    <DienstleisterLayout active="einstellungen">
      <h1 className="text-2xl font-bold mb-6">⚙️ Einstellungen</h1>

      {/* Passwort ändern */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">🔒 Passwort ändern</h2>
        {!showPasswordForm ? (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            onClick={() => setShowPasswordForm(true)}
          >
            Passwort ändern
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Aktuelles Passwort"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="password"
              placeholder="Neues Passwort"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
            <input
              type="password"
              placeholder="Neues Passwort bestätigen"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
            <div className="flex gap-2">
              <button
                onClick={handlePasswordChange}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Speichern
              </button>
              <button
                onClick={() => setShowPasswordForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Abbrechen
              </button>
            </div>
            {pwFeedback && <p className="text-sm mt-2">{pwFeedback}</p>}
          </div>
        )}
      </div>

      {/* Benachrichtigungen */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">🔔 Benachrichtigungen</h2>
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-700">E-Mail-Benachrichtigungen</span>
          <input
            type="checkbox"
            checked={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.checked)}
            className="h-5 w-5"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Push-Benachrichtigungen</span>
          <input
            type="checkbox"
            checked={notificationPush}
            onChange={(e) => setNotificationPush(e.target.checked)}
            className="h-5 w-5"
          />
        </div>
      </div>

      {/* Konto löschen */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold mb-2 text-red-600">🛑 Konto löschen</h2>
        <p className="text-sm text-gray-600 mb-3">
          Dein Konto wird archiviert und nach 2 Monaten endgültig gelöscht, sofern keine offenen Rechnungen bestehen.
        </p>
        <button
          onClick={handleKontoLoeschen}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Konto löschen
        </button>
      </div>
    </DienstleisterLayout>
  );
}
