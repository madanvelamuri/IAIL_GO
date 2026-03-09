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
    if (!window.confirm("Are you sure you want to delete this record?")) return;

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
      `report_${new Date().toISOString().split("T")[0]}.csv`
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
      : "N/A";

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
      : "N/A";

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
        label: "Monthly Incidents",
        data: Object.values(monthly),
        borderColor: "#0f172a",
        backgroundColor: "rgba(15, 23, 42, 0.05)",
        tension: 0.2,
        fill: true,
      },
    ],
  };

  const barData = {
    labels: Object.keys(typeFrequency),
    datasets: [
      {
        label: "Incident Frequency",
        data: Object.values(typeFrequency),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Operational Analytics
        </h1>
        <p className="text-slate-500 mt-1">
          Comprehensive error tracking and performance metrics.
        </p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Incidents" value={totalMistakes} />
        <KpiCard title="Current Month" value={thisMonthCount} />
        <KpiText title="MOST OF MISTAKES DONE IN " value={topMistake} />
        <KpiText title="MOST OF THE MISTAKES DONE BY" value={topEmployee} />
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">From</label>
          <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">To</label>
          <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Employee</label>
          <Input type="text" placeholder="Search Name" value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
          <Input type="text" placeholder="Search Type" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} />
        </div>
        
        <div className="flex gap-2 mt-auto">
          <Button onClick={handleSearch} color="blue">Apply Filters</Button>
          <Button onClick={handleReset} color="gray">Reset</Button>
          <Button onClick={handleExportCSV} color="green">Export CSV</Button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Monthly Incident Trend">
          <Line data={trendData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </ChartCard>
        <ChartCard title="Incident Distribution by Type">
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </ChartCard>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
            <tr>
              <th className="p-4">Claim ID</th>
              <th className="p-4">Employee</th>
              <th className="p-4">Incident Type</th>
              <th className="p-4">Description</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{m.claim_id}</td>
                <td className="p-4 text-slate-700">{m.employee_name}</td>
                <td className="p-4 text-slate-700">{m.mistake_type}</td>
                <td className="p-4 text-slate-500 max-w-xs truncate">{m.description}</td>
                <td className="p-4 text-slate-600">
                  {new Date(m.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-2"
                    title="Delete Record"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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

const KpiCard = ({ title, value }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
    <h2 className="text-3xl font-bold mt-2 text-slate-900">
      <CountUp end={value} duration={1} />
    </h2>
  </div>
);

const KpiText = ({ title, value }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
    <h2 className="text-lg font-semibold mt-2 text-slate-800 truncate">
      {value}
    </h2>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm text-sm"
  />
);

const Button = ({ children, color, ...props }) => {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    gray: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50",
    green: "bg-slate-900 hover:bg-slate-800",
  };

  const baseClass = "px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm";
  const colorClass = colors[color] || colors.blue;
  const textClass = color === "gray" ? "" : "text-white";

  return (
    <button {...props} className={`${baseClass} ${colorClass} ${textClass}`}>
      {children}
    </button>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6">
      {title}
    </h3>
    {children}
  </div>
);