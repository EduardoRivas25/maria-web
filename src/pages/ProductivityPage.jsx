import { motion } from "framer-motion";
import { Clock, CheckSquare, TrendingUp, Flame, Calendar } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart, PieChart, Pie, Cell } from "recharts";
import { mockWeeklyProductivity, mockTaskDistribution, mockMonthlyActivity, mockHeatmapData, mockProductivityMetrics } from "@/data/mockData";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1a1a1b] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((e, i) => <p key={i} className="text-xs font-semibold" style={{ color: e.color }}>{e.name}: {e.value}</p>)}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color }) {
  return (
    <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}15` }}><Icon size={18} style={{ color }} /></div>
        <span className="text-xs text-white/40 font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function ProductivityPage() {
  const m = mockProductivityMetrics;
  // Build heatmap - last 20 weeks (140 days)
  const heatmap = mockHeatmapData.slice(-140);
  const weeks = [];
  for (let i = 0; i < heatmap.length; i += 7) weeks.push(heatmap.slice(i, i + 7));

  const getHeatColor = (count) => {
    if (count === 0) return "rgba(255,255,255,0.03)";
    if (count <= 2) return "rgba(249,158,2,0.15)";
    if (count <= 4) return "rgba(249,158,2,0.35)";
    if (count <= 6) return "rgba(249,158,2,0.55)";
    return "rgba(249,158,2,0.8)";
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Clock} label="Horas productivas" value={`${m.hoursToday}h`} sub="Hoy" color="#3b82f6" />
        <MetricCard icon={CheckSquare} label="Tareas completadas" value={m.tasksCompleted} sub="Este mes" color="#10b981" />
        <MetricCard icon={TrendingUp} label="Promedio diario" value={`${m.dailyAverage}h`} sub="Últimos 30 días" color="#f99e02" />
        <MetricCard icon={Flame} label="Racha" value={`${m.streak} días`} sub="¡Sigue así! 🔥" color="#ef4444" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar Chart - Tasks per day */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Tareas completadas por día</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeeklyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tareas" name="Tareas" fill="#f99e02" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Line Chart - Weekly activity */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Actividad mensual</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockMonthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="completadas" name="Completadas" stroke="#f99e02" strokeWidth={2.5} dot={{ r: 4, fill: "#f99e02" }} />
                <Line type="monotone" dataKey="creadas" name="Creadas" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-5">
        {/* Heatmap */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Contribuciones</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-white/30">
              <span>Menos</span>
              {[0, 2, 4, 6, 7].map((v) => <div key={v} className="w-3 h-3 rounded-sm" style={{ background: getHeatColor(v) }} />)}
              <span>Más</span>
            </div>
          </div>
          <div className="flex gap-[3px] overflow-x-auto pb-2">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div key={di} className="w-3.5 h-3.5 rounded-sm cursor-pointer hover:ring-1 hover:ring-white/20 transition-all" style={{ background: getHeatColor(day.count) }} title={`${day.date}: ${day.count} actividades`} />
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Donut Chart - Task distribution */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Distribución de tareas</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockTaskDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {mockTaskDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {mockTaskDistribution.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-[11px] text-white/40">{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
