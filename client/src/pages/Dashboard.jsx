import React, { useEffect, useState } from "react";
import API from "../services/api";
import CountUp from "react-countup";
import { Bar, Line } from "react-chartjs-2";
import { Search, RotateCcw, Download, Trash2, LayoutDashboard, Eye, Calendar, User, AlertCircle, TrendingUp, BarChart3, List } from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

const BACKEND_URL = "https://iailgo-production.up.railway.app";

export default function Dashboard() {
  const [mistakes, setMistakes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [viewImage, setViewImage] = useState(null);

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    employee: "",
    type: ""
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
      data = data.filter(m =>
        m.employee_name.toLowerCase().includes(filters.employee.toLowerCase())
      );
    }

    if (filters.type) {
      data = data.filter(m =>
        m.mistake_type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }

    if (filters.from) {
      data = data.filter(
        m => new Date(m.created_at) >= new Date(filters.from)
      );
    }

    if (filters.to) {
      data = data.filter(
        m => new Date(m.created_at) <= new Date(filters.to)
      );
    }

    setFilteredData(data);
  };

  const handleReset = () => {
    setFilters({
      from: "",
      to: "",
      employee: "",
      type: ""
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
      "Created Date"
    ];

    const rows = filteredData.map(m => [
      `="${m.claim_id}"`,
      `"${m.employee_name}"`,
      `"${m.mistake_type}"`,
      `"${m.description}"`,
      `"${new Date(m.created_at).toISOString().split("T")[0]}"`
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
    m => new Date(m.created_at).getMonth() === thisMonth
  ).length;

  const typeFrequency = {};
  filteredData.forEach(m => {
    typeFrequency[m.mistake_type] = (typeFrequency[m.mistake_type] || 0) + 1;
  });

  const topMistake =
    Object.keys(typeFrequency).length > 0
      ? Object.keys(typeFrequency).reduce((a, b) =>
          typeFrequency[a] > typeFrequency[b] ? a : b
        )
      : "-";

  const employeeFrequency = {};
  filteredData.forEach(m => {
    employeeFrequency[m.employee_name] = (employeeFrequency[m.employee_name] || 0) + 1;
  });

  const topEmployee =
    Object.keys(employeeFrequency).length > 0
      ? Object.keys(employeeFrequency).reduce((a, b) =>
          employeeFrequency[a] > employeeFrequency[b] ? a : b
        )
      : "-";

  const monthly = {};
  filteredData.forEach(m => {
    const month = new Date(m.created_at).toLocaleString("default", {
      month: "short"
    });
    monthly[month] = (monthly[month] || 0) + 1;
  });

  const trendData = {
    labels: Object.keys(monthly),
    datasets: [
      {
        label: "Monthly Mistakes",
        data: Object.values(monthly),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.4,
        fill: true
      }
    ]
  };

  const barData = {
    labels: Object.keys(typeFrequency),
    datasets: [
      {
        label: "Mistake Count",
        data: Object.values(typeFrequency),
        backgroundColor: "#10b981"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-10 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-800">Analytics Dashboard 📊</h1>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-5 py-2.5 rounded-xl flex items-center shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV 📥
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Mistakes 📁" value={totalMistakes} icon={<List className="text-blue-500 w-4 h-4" />} />
        <KpiCard title="This Month 📅" value={thisMonthCount} icon={<Calendar className="text-orange-500 w-4 h-4" />} />
        <KpiText title="Most Mistake Type ⚠️" value={topMistake} icon={<AlertCircle className="text-red-500 w-4 h-4" />} />
        <KpiText title="Top Employee 👤" value={topEmployee} icon={<User className="text-emerald-500 w-4 h-4" />} />
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm font-medium">Filters 🔍 :</span>
        </div>
        <Input
          type="date"
          value={filters.from}
          onChange={e => setFilters({ ...filters, from: e.target.value })}
        />
        <Input
          type="date"
          value={filters.to}
          onChange={e => setFilters({ ...filters, to: e.target.value })}
        />
        <Input
          placeholder="Employee Name..."
          value={filters.employee}
          onChange={e => setFilters({ ...filters, employee: e.target.value })}
        />
        <Input
          placeholder="Mistake Type..."
          value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value })}
        />

        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-2 rounded-xl flex items-center shadow-sm"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </button>

        <button
          onClick={handleReset}
          className="bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 px-4 py-2 rounded-xl flex items-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Monthly Trend 📈" icon={<TrendingUp className="w-5 h-5 text-blue-600" />}>
          <Line data={trendData} />
        </ChartCard>

        <ChartCard title="Mistake Type Distribution 📊" icon={<BarChart3 className="w-5 h-5 text-emerald-600" />}>
          <Bar data={barData} />
        </ChartCard>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-50">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                Recent Records 📋
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                <tr>
                  <th className="p-4 font-semibold">Claim 🆔</th>
                  <th className="p-4 font-semibold">Employee 👤</th>
                  <th className="p-4 font-semibold">Type 🏷️</th>
                  <th className="p-4 font-semibold">Description 📝</th>
                  <th className="p-4 font-semibold">Date 📆</th>
                  <th className="p-4 font-semibold">Screenshot 🖼️</th>
                  <th className="p-4 font-semibold">Action ⚙️</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-blue-600 font-bold">#{m.claim_id}</td>
                    <td className="p-4 font-medium text-slate-700">{m.employee_name}</td>
                    <td className="p-4">
                        <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
                            {m.mistake_type}
                        </span>
                    </td>
                    <td className="p-4 text-slate-600 text-sm italic">"{m.description}"</td>
                    <td className="p-4 text-slate-500">{new Date(m.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      {m.screenshot_url ? (
                        <button
                          onClick={() => setViewImage(`${BACKEND_URL}${m.screenshot_url}`)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      ) : (
                        <span className="text-slate-300 text-sm">No Image</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                      >
                        <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      {viewImage && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="relative bg-white p-2 rounded-2xl shadow-2xl max-w-5xl w-full">
            <button
              onClick={() => setViewImage(null)}
              className="absolute -top-4 -right-4 bg-white text-slate-800 w-10 h-10 rounded-full shadow-xl flex items-center justify-center font-bold text-xl hover:bg-slate-100"
            >
              ×
            </button>
            <img
              src={viewImage}
              alt="Screenshot"
              className="rounded-xl w-full object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const KpiCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
    <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        {icon}
    </div>
    <h2 className="text-3xl font-bold text-slate-800">
      <CountUp end={value} />
    </h2>
  </div>
);

const KpiText = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
    <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        {icon}
    </div>
    <h2 className="text-lg font-bold text-slate-700 truncate">{value}</h2>
  </div>
);

const Input = props => (
  <input {...props} className="border border-slate-200 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"/>
);

const ChartCard = ({ title, children, icon }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex items-center gap-2 mb-6">
        {icon}
        <h3 className="font-bold text-slate-700">{title}</h3>
    </div>
    {children}
  </div>
);