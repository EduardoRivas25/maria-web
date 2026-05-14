import { motion } from "framer-motion";
import {
  Calendar,
  CheckSquare,
  TrendingUp,
  DollarSign,
  Mail,
  FolderOpen,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { mockEvents, mockTasks, mockEmails, mockFiles, mockWeeklyProductivity, mockTransactions } from "@/data/mockData";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function Card({ children, className = "", ...props }) {
  return (
    <motion.div
      variants={itemVariants}
      className={`bg-white/[0.03] border border-white/[0.06] backdrop-blur-md rounded-2xl p-4 sm:p-5 
                  hover:border-white/10 hover:shadow-[0_0_30px_rgba(249,158,2,0.04)] 
                  transition-all duration-300 min-w-0 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-[#f99e02]/10">
          <Icon size={16} className="text-[#f99e02]" />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {action && (
        <button className="text-xs text-white/30 hover:text-[#f99e02] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1">
          Ver todo <ArrowUpRight size={12} />
        </button>
      )}
    </div>
  );
}

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1a1a1b] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const todayEvents = mockEvents.slice(0, 3);
  const todoCount = mockTasks.filter((t) => t.status === "todo").length;
  const inProgressCount = mockTasks.filter((t) => t.status === "in-progress").length;
  const doneCount = mockTasks.filter((t) => t.status === "done").length;
  const recentEmails = mockEmails.slice(0, 4);
  const recentFiles = mockFiles.slice(0, 4);

  const totalIncome = mockTransactions.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const totalExpense = mockTransactions.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 max-w-[1400px] w-full"
    >
      {/* Upcoming Events */}
      <Card>
        <CardHeader icon={Calendar} title="Próximos Eventos" action />
        <div className="space-y-3">
          {todayEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-3 group cursor-pointer">
              <div className="w-1 h-10 rounded-full" style={{ background: event.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 font-medium truncate group-hover:text-white transition-colors">
                  {event.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={11} className="text-white/30" />
                  <p className="text-xs text-white/30">
                    {event.start.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                    {" - "}
                    {event.end.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Task Summary */}
      <Card>
        <CardHeader icon={CheckSquare} title="Resumen de Tareas" action />
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Pendientes", count: todoCount, color: "#f99e02", bg: "bg-[#f99e02]/10" },
            { label: "En progreso", count: inProgressCount, color: "#3b82f6", bg: "bg-blue-500/10" },
            { label: "Completadas", count: doneCount, color: "#10b981", bg: "bg-emerald-500/10" },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-xl p-2 sm:p-3 text-center flex flex-col justify-center`}>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: item.color }}>{item.count}</p>
              <p className="text-[10px] sm:text-[11px] text-white/50 mt-1 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Productivity Chart */}
      <Card className="lg:row-span-2 flex flex-col">
        <CardHeader icon={TrendingUp} title="Productividad Semanal" />
        <div className="flex-1 mt-2 w-full min-h-[220px] sm:min-h-[280px] relative">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeeklyProductivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                  padding={{ left: 15, right: 15 }}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(249,158,2,0.05)" }} />
                <Bar dataKey="tareas" name="Tareas Completadas" fill="#f99e02" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader icon={DollarSign} title="Resumen Financiero" action />
        <div className="space-y-3">
          {[
            { label: "Ingresos del mes", value: `$${totalIncome.toLocaleString()}`, color: "#10b981", trend: "+12%" },
            { label: "Gastos del mes", value: `$${totalExpense.toLocaleString()}`, color: "#ef4444", trend: "-8%" },
            { label: "Balance total", value: `$${(totalIncome - totalExpense).toLocaleString()}`, color: "#f99e02", trend: "+23%" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40">{item.label}</p>
                <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                item.trend.startsWith("+") ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"
              }`}>
                {item.trend}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Emails */}
      <Card>
        <CardHeader icon={Mail} title="Correos Recientes" action />
        <div className="space-y-2.5">
          {recentEmails.map((email) => (
            <div key={email.id} className="flex items-start gap-3 cursor-pointer group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold
                ${!email.read ? "bg-[#f99e02]/20 text-[#f99e02]" : "bg-white/5 text-white/30"}`}>
                {email.sender.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-medium truncate ${!email.read ? "text-white" : "text-white/50"}`}>
                    {email.sender}
                  </p>
                  {!email.read && <div className="w-1.5 h-1.5 rounded-full bg-[#f99e02] flex-shrink-0" />}
                </div>
                <p className="text-xs text-white/40 truncate mt-0.5">{email.subject}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Files */}
      <Card className="lg:col-span-2">
        <CardHeader icon={FolderOpen} title="Archivos Recientes" action />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recentFiles.map((file) => {
            const typeColors = {
              pdf: "#ef4444",
              doc: "#3b82f6",
              image: "#10b981",
              spreadsheet: "#f99e02",
            };
            return (
              <div key={file.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: `${typeColors[file.type] || "#6366f1"}15` }}>
                  <FolderOpen size={18} style={{ color: typeColors[file.type] || "#6366f1" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white/70 font-medium truncate group-hover:text-white transition-colors">{file.name}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{file.size} · {file.modified}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Welcome Card */}
      <Card className="lg:col-span-1 bg-gradient-to-br from-[#f99e02]/10 to-[#f99e02]/[0.02] border-[#f99e02]/10">
        <div className="flex flex-col items-center text-center py-2">
          <img src="/logomariaM.png" alt="M.A.R.I.A." className="w-12 h-12 mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-white mb-1">Bienvenido de vuelta</h3>
          <p className="text-xs text-white/40 leading-relaxed">
            Tienes {todoCount} tareas pendientes y {todayEvents.length} eventos hoy. ¡Vamos a ser productivos! 🚀
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
