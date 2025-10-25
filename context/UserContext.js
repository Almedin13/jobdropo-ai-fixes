import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

// 📦 Benutzerkontext erstellen
const UserContext = createContext();

// 💡 Provider-Komponente
export function UserProvider({ children }) {
  const [user, setUser] = useState(undefined); // ⏳ undefined = wird noch geladen

  useEffect(() => {
    const cookieUser = Cookies.get("user");

    if (!cookieUser) {
      setUser(null); // ❌ kein Cookie = nicht eingeloggt
      return;
    }

    try {
      const parsed = JSON.parse(cookieUser);

      if (parsed && typeof parsed === "object" && parsed.email) {
        setUser(parsed); // ✅ gültiger Benutzer im Cookie gefunden
      } else {
        console.warn("⚠️ Ungültiger Benutzer-Cookie:", parsed);
        setUser(null);
      }
    } catch (err) {
      console.error("❌ Fehler beim Parsen des Benutzer-Cookies:", err);
      setUser(null); // ❌ Parsing-Fehler
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

// 🎯 Hook zur Verwendung des Kontexts
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser muss innerhalb eines <UserProvider> verwendet werden");
  }
  return context;
};
