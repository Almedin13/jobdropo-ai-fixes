import "../styles/globals.css";
import { UserProvider } from "../context/UserContext";
import CookieBanner from "../components/CookieBanner"; // hinzufügen

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
      <CookieBanner /> {/* hinzufügen */}
    </UserProvider>
  );
}
