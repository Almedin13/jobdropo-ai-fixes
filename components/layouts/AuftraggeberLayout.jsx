import Link from "next/link";
import { useRouter } from "next/router";
export default function AuftraggeberLayout({ children }) {
  const router = useRouter();

  console.log("🧩 AuftraggeberLayout wurde geladen"); // ← genau hierher!

  const menu = [
    { name: "🏠 Dashboard", path: "/dashboard" },
    { name: "👤 Profil", path: "/dashboard/profil" },
    { name: "📋 Aufträge", path: "/dashboard/auftraege" },
    { name: "💬 Nachrichten", path: "/dashboard/nachrichten" },
    { name: "⚙️ Einstellungen", path: "/dashboard/einstellungen" },
  ];


  const abmelden = () => {
    document.cookie = "token=; Max-Age=0; path=/;";
    router.push("/login");
  };

  return (
        <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-100 p-6">


        <Link href="/auftraggeber/auftrag-erstellen">
          <button className="bg-blue-600 text-white font-semibold w-full py-2 rounded mb-6">
            Auftrag anlegen
          </button>
        </Link>

        <ul className="space-y-2">
          {menu.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <span
                  className={`block px-3 py-2 rounded hover:bg-gray-200 ${
                    router.pathname === item.path ? "bg-blue-100 font-semibold" : ""
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Hauptbereich */}
      <main className="flex-1 relative">
        {/* Abmeldebutton oben rechts */}
        <div className="absolute top-4 right-4">
          <button
            onClick={abmelden}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
          >
            Abmelden
          </button>
        </div>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
