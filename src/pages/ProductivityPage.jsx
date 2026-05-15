import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, CheckSquare, TrendingUp, Flame, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart, PieChart, Pie, Cell } from "recharts";
import { analyticsApi } from "@/lib/api/analytics";
import { isGitHubConnected, connectGitHub, disconnectGitHub, handleGitHubCallback, fetchGitHubContributions, getGitHubUsername } from "@/lib/github-auth";
import { useLocation, useNavigate } from "react-router-dom";

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
  const [metrics, setMetrics] = useState({ hoursToday: 0, tasksCompleted: 0, dailyAverage: 0, streak: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyActivity, setMonthlyActivity] = useState([]);
  const [taskDistribution, setTaskDistribution] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ghLoading, setGhLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle GitHub OAuth Callback
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code');
    if (code) {
      setGhLoading(true);
      handleGitHubCallback(code).then(() => {
        // Remove code from URL
        navigate('/dashboard/productividad', { replace: true });
        setGhLoading(false);
        fetchAll(); // Reload to fetch GH data
      });
      return;
    }

    fetchAll();
  }, [location.search]);

  async function fetchAll() {
      try {
        const [m, weekly, monthly, dist, heatmap] = await Promise.all([
          analyticsApi.getMetrics(),
          analyticsApi.getWeeklyProductivity(),
          analyticsApi.getMonthlyActivity(),
          analyticsApi.getTaskDistribution(),
          analyticsApi.getHeatmapData(140),
        ]);

        let finalHeatmap = heatmap;

        // Merge GitHub Data if connected
        if (isGitHubConnected()) {
          const ghUser = getGitHubUsername();
          if (ghUser) {
            const ghData = await fetchGitHubContributions(ghUser);
            // Create a lookup for fast merging
            const ghMap = {};
            ghData.forEach(d => ghMap[d.date.split('T')[0]] = d.count);
            
            finalHeatmap = finalHeatmap.map(day => ({
              ...day,
              count: day.count + (ghMap[day.date] || 0)
            }));
          }
        }

        setMetrics(m);
        setWeeklyData(weekly);
        setMonthlyActivity(monthly);
        setTaskDistribution(dist);
        setHeatmapData(finalHeatmap);
      } catch (err) {
        console.error("[Productivity] Load error:", err);
      } finally {
        setLoading(false);
      }
    }

  // Build heatmap weeks
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) weeks.push(heatmapData.slice(i, i + 7));

  const getHeatColor = (count) => {
    if (count === 0) return "rgba(255,255,255,0.03)";
    if (count <= 2) return "rgba(249,158,2,0.15)";
    if (count <= 4) return "rgba(249,158,2,0.35)";
    if (count <= 6) return "rgba(249,158,2,0.55)";
    return "rgba(249,158,2,0.8)";
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-[#f99e02] animate-spin" />
          <p className="text-white/40 text-sm">Cargando productividad...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Clock} label="Actividad hoy" value={`${metrics.hoursToday}`} sub="Acciones registradas" color="#3b82f6" />
        <MetricCard icon={CheckSquare} label="Tareas completadas" value={metrics.tasksCompleted} sub="Últimos 30 días" color="#10b981" />
        <MetricCard icon={TrendingUp} label="Promedio diario" value={`${metrics.dailyAverage}`} sub="Tareas/día (30 días)" color="#f99e02" />
        <MetricCard icon={Flame} label="Racha" value={`${metrics.streak} días`} sub={metrics.streak > 0 ? "¡Sigue así! 🔥" : "Empieza hoy"} color="#ef4444" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar Chart - Tasks per day */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Tareas completadas por día</h3>
          <div className="h-[240px]">
            {weeklyData.some(d => d.tareas > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tareas" name="Tareas" fill="#f99e02" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/20 text-sm">Completa tareas para ver estadísticas</div>
            )}
          </div>
        </motion.div>

        {/* Line Chart - Monthly activity */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Actividad mensual</h3>
          <div className="h-[240px]">
            {monthlyActivity.some(d => d.completadas > 0 || d.creadas > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="completadas" name="Completadas" stroke="#f99e02" strokeWidth={2.5} dot={{ r: 4, fill: "#f99e02" }} />
                  <Line type="monotone" dataKey="creadas" name="Creadas" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/20 text-sm">Sin actividad registrada aún</div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-5">
        {/* Heatmap */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-white">Contribuciones</h3>
              {ghLoading ? (
                <span className="text-[10px] text-white/40 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Conectando...</span>
              ) : isGitHubConnected() ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md font-semibold">GitHub: {getGitHubUsername()}</span>
                  <button onClick={disconnectGitHub} className="text-[10px] text-white/40 hover:text-red-400 bg-transparent border-none cursor-pointer">Desconectar</button>
                </div>
              ) : (
                <button onClick={connectGitHub} className="text-[10px] text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-md border-none cursor-pointer transition-colors">
                  Conectar GitHub
                </button>
              )}
            </div>
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
            {taskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {taskDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/20 text-sm">Crea tareas para ver distribución</div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {taskDistribution.map((d) => (
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
