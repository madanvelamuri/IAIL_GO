import React, { useEffect, useState, useMemo } from "react";
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

/* ---------------- Utility Functions ---------------- */

const formatDate = (date) =>
  new Date(date).toISOString().split("T")[0];

const safeCSV = (value) =>
  `="${String(value).replace(/"/g, '""')}"`;

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

  /* ---------------- Filtering ---------------- */

  const handleSearch = () => {
    let data = [...mistakes];

    if (filters.employee) {
      data = data.filter((m) =>
        m.employee_name
          .toLowerCase()
          .includes(filters.employee.toLowerCase())
      );
    }

    if (filters.type) {
      data = data.filter((m) =>
        m.mistake_type
          .toLowerCase()
          .includes(filters.type.toLowerCase())
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

  /* ---------------- Delete ---------------- */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;

    try {
      await API.delete(`/mistakes/${id}`);
      fetchMistakes();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  /* ---------------- CSV Export ---------------- */

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
      safeCSV(m.claim_id),
      safeCSV(m.employee_name),
      safeCSV(m.mistake_type),
      safeCSV(m.description),
      safeCSV(formatDate(m.created_at)),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `mistakes_report_${formatDate(new Date())}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ---------------- KPI Calculations ---------------- */

  const totalMistakes = filteredData.length;

  const thisMonthCount = filteredData.filter(
    (m) =>
      new Date(m.created_at).getMonth() ===
      new Date().getMonth()
  ).length;

  const typeFrequency = useMemo(() => {
    const freq = {};
    filteredData.forEach((m) => {
      freq[m.mistake_type] =
        (freq[m.mistake_type] || 0) + 1;
    });
    return freq;
  }, [filteredData]);

  const employeeFrequency = useMemo(() => {
    const freq = {};
    filteredData.forEach((m) => {
      freq[m.employee_name] =
        (freq[m.employee_name] || 0) + 1;
    });
    return freq;
  }, [filteredData]);

  const topMistake =
    Object.keys(typeFrequency).length > 0
      ? Object.keys(typeFrequency).reduce((a, b) =>
          typeFrequency[a] > typeFrequency[b] ? a : b
        )
      : "-";

  const topEmployee =
    Object.keys(employeeFrequency).length > 0
      ? Object.keys(employeeFrequency).reduce((a, b) =>
          employeeFrequency[a] > employeeFrequency[b] ? a : b
        )
      : "-";

  /* ---------------- Chart Data ---------------- */

  const monthly = useMemo(() => {
    const result = {};
    filteredData.forEach((m) => {
      const month = new Date(
        m.created_at
      ).toLocaleString("default", {
        month: "short",
      });
      result[month] = (result[month] || 0) + 1;
    });
    return result;
  }, [filteredData]);

  const trendData = {
    labels: Object.keys(monthly),
    datasets: [
      {
        label: "Monthly Mistakes 📉",
        data: Object.values(monthly),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#1e40af",
        pointBorderColor: "#fff",
        pointHoverRadius: 6,
      },
    ],
  };

  const barData = {
    labels: Object.keys(typeFrequency),
    datasets: [
      {
        label: "Mistake Count 🐞",
        data: Object.values(typeFrequency),
        backgroundColor: [
          "rgba(244,63,94,0.8)",
          "rgba(14,165,233,0.8)",
          "rgba(34,197,94,0.8)",
          "rgba(168,85,247,0.8)",
        ],
        borderRadius: 8,
      },
    ],
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 space-y-10 font-sans text-slate-900">

      {/* Header */}
      <div>
        <h1 className="text-5xl font-black tracking-tight text-slate-900">
          📊 Analytics Dashboard
        </h1>
        <p className="text-slate-500 mt-3 text-lg font-medium italic">
          Mistake tracking insights & performance overview 🚀
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Mistakes 🐞" value={totalMistakes} color="text-blue-600" />
        <KpiCard title="This Month 📅" value={thisMonthCount} color="text-indigo-600" />
        <KpiText title="Most of Mistakes Done in 🔥" value={topMistake} color="text-rose-600" />
        <KpiText title="Mostly Mistake Done By 🧑‍💻" value={topEmployee} color="text-emerald-600" />
      </div>

      {/* Filter */}
      <div className="bg-white p-6 rounded-3xl shadow-xl border flex flex-wrap gap-4">

        <Input type="date" value={filters.from}
          onChange={(e) =>
            setFilters({ ...filters, from: e.target.value })
          }
        />

        <Input type="date" value={filters.to}
          onChange={(e) =>
            setFilters({ ...filters, to: e.target.value })
          }
        />

        <Input type="text" placeholder="Employee 👤"
          value={filters.employee}
          onChange={(e) =>
            setFilters({
              ...filters,
              employee: e.target.value,
            })
          }
        />

        <Input type="text" placeholder="Mistake Type 🐞"
          value={filters.type}
          onChange={(e) =>
            setFilters({
              ...filters,
              type: e.target.value,
            })
          }
        />

        <Button onClick={handleSearch} color="blue">
          🔍 Search
        </Button>

        <Button onClick={handleReset} color="gray">
          ♻️ Reset
        </Button>

        <Button onClick={handleExportCSV} color="green">
          📄 Export CSV
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Monthly Trend 📈">
          <Line data={trendData} />
        </ChartCard>

        <ChartCard title="Mistake Type Distribution 🐞">
          <Bar data={barData} />
        </ChartCard>
      </div>
    </div>
  );
}

/* ---------------- UI Components ---------------- */

const KpiCard = ({ title, value, color }) => (
  <div className="bg-white p-7 rounded-3xl shadow-lg border">
    <p className="text-slate-400 font-bold uppercase text-[11px]">
      {title}
    </p>
    <h2 className={`text-5xl font-black mt-4 ${color}`}>
      <CountUp end={value} duration={2} separator="," />
    </h2>
  </div>
);

const KpiText = ({ title, value, color }) => (
  <div className="bg-white p-7 rounded-3xl shadow-lg border">
    <p className="text-slate-400 font-bold uppercase text-[11px]">
      {title}
    </p>
    <h2 className={`text-2xl font-black mt-4 ${color}`}>
      {value}
    </h2>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="bg-slate-50 border px-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500"
  />
);

const Button = ({ children, color, ...props }) => {
  const colors = {
    blue: "bg-slate-900 hover:bg-blue-600",
    gray: "bg-slate-300 hover:bg-slate-400",
    green: "bg-emerald-600 hover:bg-emerald-700",
  };

  return (
    <button
      {...props}
      className={`${colors[color]} text-white px-6 py-2 rounded-xl`}
    >
      {children}
    </button>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-xl border">
    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
      {title}
    </h3>
    <div className="min-h-[300px] flex items-center justify-center">
      {children}
    </div>
  </div>
);