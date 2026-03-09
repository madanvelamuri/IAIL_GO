import React, { useEffect, useState } from "react";
import API from "../services/api";
import CountUp from "react-countup";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [mistakes, setMistakes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    employee: "",
    type: "",
  });

  useEffect(() => {
    fetchMistakes();
  }, []);

  const fetchMistakes = async () => {
    try {
      const res = await API.get("/mistakes");
      setMistakes(res.data);
      setFilteredData(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleSearch = () => {
    let data = [...mistakes];

    if (filters.employee) {
      data = data.filter((m) =>
        m.employee_name.toLowerCase().includes(filters.employee.toLowerCase())
      );
    }

    if (filters.type) {
      data = data.filter((m) =>
        m.mistake_type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    if (filters.from) {
      data = data.filter(
        (m) => new Date(m.created_at) >= new Date(filters.from)
      );
    }

    if (filters.to) {
      data = data.filter(
        (m) => new Date(m.created_at) <= new Date(filters.to)
      );
    }

    setFilteredData(data);
  };

  const handleReset = () => {
    setFilters({
      from: "",
      to: "",
      employee: "",
      type: "",
    });
    setFilteredData(mistakes);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;

    try {
      await API.delete(`/mistakes/${id}`);
      fetchMistakes();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "Claim ID",
      "Employee Name",
      "Mistake Type",
      "Description",
      "Created Date",
    ];

    const rows = filteredData.map((m) => [
      `="${m.claim_id}"`,
      `"${m.employee_name}"`,
      `"${m.mistake_type}"`,
      `"${m.description}"`,
      `"${new Date(m.created_at).toISOString().split("T")[0]}"`,
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `mistakes_report_${new Date().toISOString().split("T")[0]}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMistakes = filteredData.length;

  const thisMonth = new Date().getMonth();
  const thisMonthCount = filteredData.filter(
    (m) => new Date(m.created_at).getMonth() === thisMonth
  ).length;

  const typeFrequency = {};
  filteredData.forEach((m) => {
    typeFrequency[m.mistake_type] =
      (typeFrequency[m.mistake_type] || 0) + 1;
  });

  const topMistake =
    Object.keys(typeFrequency).length > 0
      ? Object.keys(typeFrequency).reduce((a, b) =>
          typeFrequency[a] > typeFrequency[b] ? a : b
        )
      : "-";

  const employeeFrequency = {};
  filteredData.forEach((m) => {
    employeeFrequency[m.employee_name] =
      (employeeFrequency[m.employee_name] || 0) + 1;
  });

  const topEmployee =
    Object.keys(employeeFrequency).length > 0
      ? Object.keys(employeeFrequency).reduce((a, b) =>
          employeeFrequency[a] > employeeFrequency[b] ? a : b
        )
      : "-";

  const monthly = {};
  filteredData.forEach((m) => {
    const month = new Date(m.created_at).toLocaleString("default", {
      month: "short",
    });
    monthly[month] = (monthly[month] || 0) + 1;
  });

  const trendData = {
    labels: Object.keys(monthly),
    datasets: [
      {
        label: "Monthly Trend",
        data: Object.values(monthly),
        borderColor: "#6366f1", // Indigo
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#4f46e5",
      },
    ],
  };

  const barData = {
    labels: Object.keys(typeFrequency),
    datasets: [
      {
        label: "Frequency",
        data: Object.values(typeFrequency),
        backgroundColor: [
          "#3b82f6", // Blue
          "#10b981", // Emerald
          "#f59e0b", // Amber
          "#ef4444", // Red
          "#8b5cf6", // Violet
        ],
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-10 space-y-12 text-slate-900">

      <div className="border-l-4 border-indigo-600 pl-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
          📊 Operational Analytics
        </h1>
        <p className="text-slate-500 mt-2 font-medium uppercase text-xs tracking-widest">
          Insight Engine & Performance Tracking 🚀
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title="Total Mistakes 🐞" value={totalMistakes} color="text-blue-600" bg="bg-blue-50" />
        <KpiCard title="This Month 📅" value={thisMonthCount} color="text-indigo-600" bg="bg-indigo-50" />
        <KpiText title="Primary Type 🔥" value={topMistake} color="text-rose-600" bg="bg-rose-50" />
        <KpiText title="Lead Contributor 🧑‍💻" value={topEmployee} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">From</label>
          <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">To</label>
          <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Staff</label>
          <Input type="text" placeholder="Search Employee..." value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Type</label>
          <Input type="text" placeholder="Search Error Type..." value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} />
        </div>
        
        <div className="flex gap-2 mt-5">
          <Button onClick={handleSearch} color="blue">🔍 Search</Button>
          <Button onClick={handleReset} color="gray">♻️ Reset</Button>
          <Button onClick={handleExportCSV} color="green">📄 Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <ChartCard title="Monthly Volume Trend 📈">
          <Line data={trendData} options={{ plugins: { legend: { display: false } } }} />
        </ChartCard>
        <ChartCard title="Error Categorization 🐞">
          <Bar data={barData} options={{ plugins: { legend: { display: false } } }} />
        </ChartCard>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-tighter border-b border-slate-100">
            <tr>
              <th className="p-5 text-left">📌 Claim ID</th>
              <th className="p-5 text-left">👤 Employee</th>
              <th className="p-5 text-left">🐞 Type</th>
              <th className="p-5 text-left">📝 Description</th>
              <th className="p-5 text-left">📅 Date</th>
              <th className="p-5 text-center">⚙️ Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.map((m) => (
              <tr key={m.id} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="p-5 font-bold text-slate-700">{m.claim_id}</td>
                <td className="p-5 font-medium text-slate-600">{m.employee_name}</td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[11px] font-bold border border-slate-200">
                    {m.mistake_type}
                  </span>
                </td>
                <td className="p-5 text-slate-400 italic max-w-xs truncate">{m.description}</td>
                <td className="p-5 font-mono text-slate-500">
                  {new Date(m.created_at).toISOString().split("T")[0]}
                </td>
                <td className="p-5 text-center">
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="bg-white border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white p-2 rounded-xl shadow-sm transition-all active:scale-90"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

const KpiCard = ({ title, value, color, bg }) => (
  <div className={`bg-white p-7 rounded-3xl shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-24 h-24 ${bg} rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500 opacity-50`} />
    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest relative z-10">{title}</p>
    <h2 className={`text-4xl font-black mt-3 ${color} relative z-10 tabular-nums`}>
      <CountUp end={value} duration={1.5} /> <span className="text-xl opacity-40 italic">😅</span>
    </h2>
  </div>
);

const KpiText = ({ title, value, color, bg }) => (
  <div className={`bg-white p-7 rounded-3xl shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group`}>
    <div className={`absolute top-0 right-0 w-24 h-24 ${bg} rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500 opacity-50`} />
    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest relative z-10">{title}</p>
    <h2 className={`text-lg font-bold mt-3 ${color} relative z-10 truncate leading-tight`}>
      {value} <span className="opacity-40 italic">😬</span>
    </h2>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="border border-slate-200 bg-slate-50/50 px-4 py-2.5 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none shadow-inner transition-all text-sm font-medium"
  />
);

const Button = ({ children, color, ...props }) => {
  const colors = {
    blue: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200",
    gray: "bg-slate-500 hover:bg-slate-600 shadow-slate-200",
    green: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
  };

  return (
    <button
      {...props}
      className={`${colors[color]} text-white px-7 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 font-bold text-sm`}
    >
      {children}
    </button>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-50 pb-4">
      {title}
    </h3>
    <div className="h-[300px] flex items-center justify-center">
        {children}
    </div>
  </div>
);