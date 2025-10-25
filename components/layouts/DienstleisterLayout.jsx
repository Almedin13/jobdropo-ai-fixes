// components/layouts/DienstleisterLayout.jsx
import Link from "next/link";
import DLSidebar from "../navigation/DLSidebar";

export default function DienstleisterLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-0 px-0 lg:px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar links */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2">
            <DLSidebar />
          </aside>

          {/* Content rechts */}
          <main className="col-span-12 md:col-span-9 lg:col-span-10">
            {/* Topbar (nur Abmelden) */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {title || "Dashboard"}
              </h1>
              <Link
                href="/logout"
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow"
              >
                Abmelden
              </Link>
            </div>

            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
