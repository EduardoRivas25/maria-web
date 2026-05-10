import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart, PieChart, Pie, Cell } from "recharts";
import { mockTransactions, mockFinancialGoals, mockMonthlyFinances, mockExpensesByCategory } from "@/data/mockData";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1a1a1b] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((e, i) => <p key={i} className="text-xs font-semibold" style={{ color: e.color }}>{e.name}: ${e.value.toLocaleString()}</p>)}
    </div>
  );
}

export default function FinancesPage() {
  const totalIncome = mockTransactions.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const totalExpense = mockTransactions.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Ingresos del mes", value: totalIncome, icon: TrendingUp, color: "#10b981", trend: "+12%", trendUp: true },
          { label: "Gastos del mes", value: totalExpense, icon: TrendingDown, color: "#ef4444", trend: "-8%", trendUp: false },
          { label: "Balance total", value: balance, icon: DollarSign, color: "#f99e02", trend: "+23%", trendUp: true },
        ].map((c) => (
          <motion.div key={c.label} variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl" style={{ background: `${c.color}15` }}><c.icon size={16} style={{ color: c.color }} /></div>
                <span className="text-xs text-white/40 font-medium">{c.label}</span>
              </div>
              <span className={`text-xs font-medium flex items-center gap-0.5 px-2 py-1 rounded-lg ${c.trendUp ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
                {c.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{c.trend}
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: c.color }}>${c.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar: Income vs Expenses */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Ingresos vs Gastos</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockMonthlyFinances}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie: Expenses by category */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Gastos por categoría</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockExpensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {mockExpensesByCategory.map((e) => <Cell key={e.name} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {mockExpensesByCategory.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-[11px] text-white/40">{d.name} (${d.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Evolution + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
        {/* Line: Monthly evolution */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Evolución mensual</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockMonthlyFinances}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} />
                <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: "#ef4444" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Financial Goals */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-[#f99e02]/10"><Target size={16} className="text-[#f99e02]" /></div>
            <h3 className="text-sm font-semibold text-white">Metas financieras</h3>
          </div>
          <div className="space-y-5">
            {mockFinancialGoals.map((goal) => {
              const pct = Math.round((goal.current / goal.target) * 100);
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70 font-medium">{goal.name}</span>
                    <span className="text-xs font-bold" style={{ color: goal.color }}>{pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }} className="h-full rounded-full" style={{ background: goal.color }} />
                  </div>
                  <p className="text-xs text-white/30 mt-1.5">${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div variants={item} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Transacciones recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["Descripción", "Categoría", "Tipo", "Monto", "Fecha"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-white/30 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map((tr) => (
                <tr key={tr.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-sm text-white/70">{tr.description}</td>
                  <td className="px-5 py-3"><span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-lg">{tr.category}</span></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${tr.type === "income" ? "text-emerald-400 bg-emerald-400/10" : "text-red-400 bg-red-400/10"}`}>
                      {tr.type === "income" ? "Ingreso" : "Gasto"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold" style={{ color: tr.type === "income" ? "#10b981" : "#ef4444" }}>
                    {tr.type === "income" ? "+" : "-"}${tr.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-xs text-white/30">{tr.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
