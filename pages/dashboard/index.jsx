import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import AuftraggeberLayout from "../../components/layouts/AuftraggeberLayout";
import { useUser } from "../../context/UserContext";
import NachrichtenTile from "../../components/NachrichtenTile";

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [auftraege, setAuftraege] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔒 Zugriffsschutz
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user !== undefined && user.rolle !== "auftraggeber") {
      router.push("/dienstleister/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchAuftraege() {
      const res = await fetch(`/api/auftraege?userEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      setAuftraege(data);
      setLoading(false);
    }
    fetchAuftraege();
  }, [user]);

  const COLORS = ["#00C49F", "#FFBB28", "#FF8042"];

  const statusData = [
    { name: "offen", value: auftraege.filter((a) => a.status === "offen").length },
    { name: "vergeben", value: auftraege.filter((a) => a.status === "vergeben").length },
    { name: "abgelehnt", value: auftraege.filter((a) => a.status === "abgelehnt").length },
  ].filter((entry) => entry.value > 0);

  const tasks = [
    { date: new Date(), title: "Anruf mit Dienstleister" },
    { date: new Date(new Date().setDate(new Date().getDate() + 1)), title: "Auftrag prüfen" },
  ];

  const getTasksForDate = (date) =>
    tasks.filter((task) => task.date.toDateString() === date.toDateString());

  if (!user) return <p className="text-center mt-10">Bitte einloggen...</p>;

  return (
    <AuftraggeberLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Hallo {user?.name || "!"}</h1>
        <p className="text-gray-600">Willkommen im Auftraggeber-Dashboard.</p>

        {/* Kacheln */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 shadow rounded">
            <h2 className="text-lg font-semibold">📁 Aufträge insgesamt</h2>
            <p className="text-2xl">{auftraege.length}</p>
          </div>

          <div className="bg-white p-4 shadow rounded">
            <h2 className="text-lg font-semibold">📌 Offene Aufträge</h2>
            <p className="text-2xl">{auftraege.filter((a) => a.status === "offen").length}</p>
          </div>

          {/* 🔔 Nachrichten-Kachel mit Badge & Klick zu /dashboard/nachrichten */}
          <NachrichtenTile ownerEmail={user?.email} />
        </div>

        {/* Diagramm + Kalender */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Kreisdiagramm */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">📊 Auftragsstatus</h2>
            <PieChart width={300} height={300}>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </div>

          {/* Kalender mit Aufgaben */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">📅 Dein Kalender</h2>
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              className="w-full"
              tileClassName={({ date }) =>
                date.toDateString() === new Date().toDateString()
                  ? "bg-blue-100 text-blue-700 font-bold rounded"
                  : null
              }
            />
            <p className="mt-4 text-gray-600">
              Ausgewähltes Datum:{" "}
              <span className="font-semibold">
                {selectedDate.toLocaleDateString()}
              </span>
            </p>
            <ul className="mt-2 space-y-2">
              {getTasksForDate(selectedDate).length > 0 ? (
                getTasksForDate(selectedDate).map((task, index) => (
                  <li
                    key={index}
                    className="p-2 bg-blue-50 text-blue-800 rounded shadow"
                  >
                    📌 {task.title}
                  </li>
                ))
              ) : (
                <li className="text-gray-500">Keine Termine für diesen Tag</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </AuftraggeberLayout>
  );
}
