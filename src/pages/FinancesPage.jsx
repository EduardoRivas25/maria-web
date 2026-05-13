import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Target, ArrowUpRight, ArrowDownRight, Plus, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, LineChart, PieChart, Pie, Cell } from "recharts";
import { mockTransactions, mockFinancialGoals } from "@/data/mockData";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const CHART_COLORS = ["#f99e02", "#3b82f6", "#8b5cf6", "#ef4444", "#10b981", "#ec4899", "#14b8a6", "#eab308"];

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
  const [transactions, setTransactions] = useState(mockTransactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0]
  });

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
  const balance = totalIncome - totalExpense;

  const expensesByCategory = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        const existing = acc.find(item => item.name === curr.category);
        if (existing) {
          existing.value += curr.amount;
        } else {
          acc.push({ name: curr.category, value: curr.amount, color: CHART_COLORS[acc.length % CHART_COLORS.length] });
        }
        return acc;
      }, []);
  }, [transactions]);

  const monthlyFinances = useMemo(() => {
    const data = transactions.reduce((acc, curr) => {
      const date = new Date(curr.date);
      // Adjust date to local timezone to avoid off-by-one errors with UTC
      const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const month = monthNames[localDate.getMonth()];
      
      let existing = acc.find(item => item.month === month);
      if (!existing) {
        existing = { month, ingresos: 0, gastos: 0, monthNum: localDate.getMonth() };
        acc.push(existing);
      }
      if (curr.type === 'income') existing.ingresos += curr.amount;
      if (curr.type === 'expense') existing.gastos += curr.amount;
      return acc;
    }, []);
    return data.sort((a, b) => a.monthNum - b.monthNum);
  }, [transactions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.description || !formData.date) return;

    const newTransaction = {
      id: `tr${Date.now()}`,
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      description: formData.description
    };

    setTransactions([newTransaction, ...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)));
    setIsModalOpen(false);
    setFormData({
      type: "expense",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0]
    });
  };

  return (
    <div className="relative">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] space-y-6">
        
        {/* Header with Action */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Finanzas</h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Nueva Transacción
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Ingresos totales", value: totalIncome, icon: TrendingUp, color: "#10b981" },
            { label: "Gastos totales", value: totalExpense, icon: TrendingDown, color: "#ef4444" },
            { label: "Balance actual", value: balance, icon: DollarSign, color: balance >= 0 ? "#10b981" : "#ef4444" },
          ].map((c) => (
            <motion.div key={c.label} variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl" style={{ background: `${c.color}15` }}><c.icon size={16} style={{ color: c.color }} /></div>
                  <span className="text-xs text-white/40 font-medium">{c.label}</span>
                </div>
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
                <BarChart data={monthlyFinances}>
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
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {expensesByCategory.map((e) => <Cell key={e.name} fill={e.color} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">No hay gastos registrados</div>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {expensesByCategory.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-[11px] text-white/40">{d.name} (${d.value.toLocaleString()})</span>
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
                <LineChart data={monthlyFinances}>
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
                {transactions.map((tr) => (
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
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-white/40">No hay transacciones registradas</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#131314] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h3 className="text-lg font-bold text-white">Nueva Transacción</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                
                {/* Tipo de Transacción */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      formData.type === "income" 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "expense" })}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      formData.type === "expense" 
                        ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                        : "bg-white/5 text-white/50 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    Gasto
                  </button>
                </div>

                {/* Monto y Fecha */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/60 font-medium">Monto</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                      <input 
                        type="number" required min="0" step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-white text-sm outline-none focus:border-[#f99e02] focus:ring-1 focus:ring-[#f99e02]/50 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/60 font-medium">Fecha</label>
                    <input 
                      type="date" required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#f99e02] focus:ring-1 focus:ring-[#f99e02]/50 transition-all"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                </div>

                {/* Categoría */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 font-medium">Categoría</label>
                  <input 
                    type="text" required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#f99e02] focus:ring-1 focus:ring-[#f99e02]/50 transition-all"
                    placeholder="Ej. Comida, Sueldo, Transporte..."
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 font-medium">Descripción</label>
                  <input 
                    type="text" required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#f99e02] focus:ring-1 focus:ring-[#f99e02]/50 transition-all"
                    placeholder="Detalles de la transacción..."
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#f99e02] hover:bg-[#e08e02] text-white font-medium py-3 rounded-xl mt-2 transition-colors shadow-[0_0_15px_rgba(249,158,2,0.3)]"
                >
                  Guardar Transacción
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

