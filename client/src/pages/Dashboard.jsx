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
    if (!window.confirm("ARE YOU ABSOLUTELY SURE YOU WANT TO DO THIS")) return;

    try {
      await API.delete(`/mistakes/${id}`);
      fetchMistakes();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("NOTHING TO EXPORT CHIEF");
      return;
    }

    const headers = ["Claim ID", "Employee Name", "Mistake Type", "Description", "Created Date"];
    const rows = filteredData.map((m) => [
      `="${m.claim_id}"`,
      `"${m.employee_name}"`,
      `"${m.mistake_type}"`,
      `"${m.description}"`,
      `"${new Date(m.created_at).toISOString().split("T")[0]}"`,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `OOPS_REPORT_${new Date().toISOString().split("T")[0]}.csv`);
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
    typeFrequency[m.mistake_type] = (typeFrequency[m.mistake_type] || 0) + 1;
  });

  const topMistake = Object.keys(typeFrequency).length > 0
    ? Object.keys(typeFrequency).reduce((a, b) => typeFrequency[a] > typeFrequency[b] ? a : b)
    : "NOTHING YET";

  const employeeFrequency = {};
  filteredData.forEach((m) => {
    employeeFrequency[m.employee_name] = (employeeFrequency[m.employee_name] || 0) + 1;
  });

  const topEmployee = Object.keys(employeeFrequency).length > 0
    ? Object.keys(employeeFrequency).reduce((a, b) => employeeFrequency[a] > employeeFrequency[b] ? a : b)
    : "GHOST";

  const monthly = {};
  filteredData.forEach((m) => {
    const month = new Date(m.created_at).toLocaleString("default", { month: "short" });
    monthly[month] = (monthly[month] || 0) + 1;
  });

  const trendData = {
    labels: Object.keys(monthly),
    datasets: [{
      label: "Chaos Level",
      data: Object.values(monthly),
      borderColor: "#FF00FF",
      backgroundColor: "rgba(255, 0, 255, 0.2)",
      tension: 0.5,
      fill: true,
      pointRadius: 10,
    }],
  };

  const barData = {
    labels: Object.keys(typeFrequency),
    datasets: [{
      label: "Count of Blunders",
      data: Object.values(typeFrequency),
      backgroundColor: ["#FFFF00", "#00FFFF", "#FF00FF", "#00FF00"],
      borderColor: "#000000",
      borderWidth: 3,
    }],
  };

  return (
    <div className="min-h-screen bg-yellow-200 p-8 font-mono select-none">
      
      {/* Header Section */}
      <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] mb-10 rotate-1 transition-transform hover:rotate-0">
        <h1 className="text-6xl font-black text-black tracking-tighter italic uppercase">
          Mistake Hub 5000
        </h1>
        <p className="text-xl font-bold bg-pink-400 text-white inline-block px-2 mt-4">
          LOOK AT ALL THESE GLORIOUS ERRORS
        </p>
        <div className="mt-6">
          <Button onClick={handleExportCSV} color="dark">GIVE ME THE CSV FILE NOW</Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="THE TOTAL COUNT" value={totalMistakes} color="bg-cyan-300" />
        <KpiCard title="THIS MONTHS MESS" value={thisMonthCount} color="bg-green-400" />
        <KpiText title="THE CHAMPION MISTAKE" value={topMistake} color="bg-fuchsia-400" />
        <KpiText title="MVP OF MISTAKES" value={topEmployee} color="bg-orange-400" />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-blue-400 p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-wrap gap-6 items-end mt-12 mb-12">
        <div className="flex-1 min-w-[200px] space-y-2 font-black text-white italic">
          <label>STARTING FROM</label>
          <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div className="flex-1 min-w-[200px] space-y-2 font-black text-white italic">
          <label>ENDING AT</label>
          <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div className="flex-1 min-w-[200px] space-y-2 font-black text-white italic">
          <label>WHO DID IT</label>
          <Input type="text" placeholder="TYPE A NAME..." value={filters.employee} onChange={(e) => setFilters({ ...filters, employee: e.target.value })} />
        </div>
        <div className="flex-1 min-w-[200px] space-y-2 font-black text-white italic">
          <label>WHAT KIND</label>
          <Input type="text" placeholder="WHAT HAPPENED..." value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} />
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSearch} color="blue">GO GO GO</Button>
          <Button onClick={handleReset} color="gray">CLEAR EVERYTHING</Button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <ChartCard title="THE UP AND DOWN GRAPH">
          <Line data={trendData} />
        </ChartCard>
        <ChartCard title="THE RECTANGLE CHART">
          <Bar data={barData} />
        </ChartCard>
      </div>

      {/* Data Table */}
      <div className="bg-white border-8 border-black shadow-[15px_15px_0px_0px_rgba(255,0,255,1)] overflow-hidden mb-20">
        <table className="w-full text-lg text-left border-collapse">
          <thead className="bg-black text-yellow-300 font-black uppercase text-xl italic underline">
            <tr>
              <th className="p-5 border-4 border-black">CLAIM</th>
              <th className="p-5 border-4 border-black">HUMAN</th>
              <th className="p-5 border-4 border-black">OOPS TYPE</th>
              <th className="p-5 border-4 border-black">THE STORY</th>
              <th className="p-5 border-4 border-black">WHEN</th>
              <th className="p-5 border-4 border-black text-center">ELIMINATE</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-black font-bold">
            {filteredData.map((m) => (
              <tr key={m.id} className="hover:bg-yellow-100 transition-colors odd:bg-pink-50 even:bg-white">
                <td className="p-5 border-4 border-black">{m.claim_id}</td>
                <td className="p-5 border-4 border-black text-blue-600">{m.employee_name}</td>
                <td className="p-5 border-4 border-black">
                    <span className="p-2 bg-black text-white uppercase text-xs">
                        {m.mistake_type}
                    </span>
                </td>
                <td className="p-5 border-4 border-black italic font-normal text-sm">{m.description}</td>
                <td className="p-5 border-4 border-black text-purple-600">
                  {m.created_at}
                </td>
                <td className="p-5 text-center border-4 border-black">
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="bg-red-500 text-white font-black p-4 border-4 border-black hover:bg-black hover:text-red-500 transition-all active:scale-75"
                  >
                    DELETE ME
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

const KpiCard = ({ title, value, color }) => (
  <div className={`${color} p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-2 hover:rotate-0 transition-transform`}>
    <p className="font-black text-black uppercase tracking-tighter text-sm underline decoration-black underline-offset-4">{title}</p>
    <h2 className="text-6xl font-black mt-2 text-black">
      <CountUp end={value} duration={2} />
    </h2>
  </div>
);

const KpiText = ({ title, value, color }) => (
  <div className={`${color} p-6 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-2 hover:rotate-0 transition-transform`}>
    <p className="font-black text-black uppercase tracking-tighter text-sm underline decoration-black underline-offset-4">{title}</p>
    <h2 className="text-2xl font-black mt-2 text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase">
      {value}
    </h2>
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="border-4 border-black px-4 py-3 bg-white focus:bg-yellow-50 focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg font-bold w-full"
  />
);

const Button = ({ children, color, ...props }) => {
  const colors = {
    blue: "bg-green-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
    gray: "bg-red-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none",
    dark: "bg-black text-yellow-300 shadow-[8px_8px_0px_0px_rgba(255,0,255,1)] hover:scale-105",
  };

  return (
    <button
      {...props}
      className={`${colors[color]} px-8 py-4 font-black uppercase text-lg transition-all border-4 border-black`}
    >
      {children}
    </button>
  );
};

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-8 border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
    <h3 className="text-2xl font-black text-black uppercase mb-8 border-b-4 border-black pb-2 italic">
      {title}
    </h3>
    <div className="bg-slate-50 p-4 border-2 border-dashed border-black">
        {children}
    </div>
  </div>
);