import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, X, Target, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { financesApi } from "@/lib/api/finances";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1a1a1b] border border-white/10 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: e.color }}>{e.name}: ${e.value?.toLocaleString()}</p>
      ))}
    </div>
  );
}

export default function FinancesPage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [expensesByCategory, setExpensesByCategory] = useState([]);
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTx, setNewTx] = useState({ type: "expense", amount: "", category: "", description: "", date: "" });
  const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", icon: "📱", color: "#3b82f6" });
  const [customCategory, setCustomCategory] = useState("");
  const [txLimit, setTxLimit] = useState(5);

  const goalIcons = [
    { emoji: '📱', label: 'Tecnología' },
    { emoji: '💻', label: 'Computadora' },
    { emoji: '🚗', label: 'Coche' },
    { emoji: '🎓', label: 'Educación' },
    { emoji: '👗', label: 'Moda' },
    { emoji: '✈️', label: 'Viaje' },
    { emoji: '🏠', label: 'Casa' },
    { emoji: '🎮', label: 'Juegos' },
  ];

  const fetchAll = useCallback(async () => {
    try {
      const [txs, sum, monthly, byCat, gls, cats] = await Promise.all([
        financesApi.getTransactions({ limit: 15 }),
        financesApi.getSummary(),
        financesApi.getMonthlyData(),
        financesApi.getExpensesByCategory(),
        financesApi.getGoals(),
        financesApi.getCategories(),
      ]);
      setTransactions(txs);
      setSummary(sum);
      setMonthlyData(monthly.filter(m => m.ingresos > 0 || m.gastos > 0));
      setExpensesByCategory(byCat);
      setGoals(gls);
      setCategories(cats);
    } catch (err) {
      console.error("[Finances] Load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleCreateTransaction(e) {
    e.preventDefault();
    setSaving(true);
    const finalCategory = newTx.category === "Otro" ? customCategory : newTx.category;
    try {
      await financesApi.addTransaction({
        type: newTx.type,
        amount: newTx.amount,
        category: finalCategory,
        description: newTx.description,
        date: newTx.date || undefined,
      });
      setNewTx({ type: "expense", amount: "", category: "", description: "", date: "" });
      setCustomCategory("");
      setShowModal(false);
      fetchAll();
    } catch (err) {
      console.error("[Finances] Create error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateGoal(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await financesApi.createGoal({
        name: `${newGoal.icon} ${newGoal.name}`,
        targetAmount: newGoal.targetAmount,
        color: newGoal.color,
      });
      setNewGoal({ name: "", targetAmount: "", icon: "📱", color: "#3b82f6" });
      setShowGoalModal(false);
      fetchAll();
    } catch (err) {
      console.error("[Finances] Create goal error:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-[#f99e02] animate-spin" />
          <p className="text-white/40 text-sm">Cargando finanzas...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] space-y-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Finanzas</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f99e02] hover:bg-[#e08e02] text-white text-sm font-semibold border-none cursor-pointer transition-colors shadow-[0_0_20px_rgba(249,158,2,0.2)]">
          <Plus size={16} /> Nueva Transacción
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Wallet, label: "Balance", value: `$${summary.balance.toLocaleString()}`, color: "#f99e02", sub: "Este mes" },
          { icon: TrendingUp, label: "Ingresos", value: `$${summary.income.toLocaleString()}`, color: "#10b981", sub: "Total ingresos" },
          { icon: TrendingDown, label: "Gastos", value: `$${summary.expense.toLocaleString()}`, color: "#ef4444", sub: "Total gastos" },
        ].map((card) => (
          <motion.div key={card.label} variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl" style={{ background: `${card.color}15` }}>
                <card.icon size={18} style={{ color: card.color }} />
              </div>
              <span className="text-xs text-white/40 font-medium">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-white/30 mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar Chart — Income vs Expenses */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Ingresos vs Gastos</h3>
          <div className="h-[240px]">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/20 text-sm">Sin datos aún</div>
            )}
          </div>
        </motion.div>

        {/* Pie Chart — Expenses by Category */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Gastos por categoría</h3>
          <div className="h-[200px]">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {expensesByCategory.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-white/20 text-sm">Sin gastos registrados</div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {expensesByCategory.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <span className="text-[11px] text-white/40">{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Goals + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-5">
        {/* Transactions List */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Últimas transacciones</h3>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-white/20 text-sm">Sin transacciones aún. ¡Agrega la primera!</div>
            ) : transactions.slice(0, txLimit).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tx.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    {tx.type === "income" ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                  </div>
                  <div>
                    <p className="text-sm text-white/80">{tx.description}</p>
                    <p className="text-[11px] text-white/30">{tx.category_name} · {new Date(tx.date + 'T12:00:00').toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.type === "income" ? "+" : "-"}${parseFloat(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          {transactions.length > txLimit && (
            <button 
              onClick={() => setTxLimit(prev => prev + 5)}
              className="w-full mt-3 py-2 text-xs font-medium text-white/40 hover:text-white/80 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl border border-white/[0.04] transition-colors cursor-pointer"
            >
              Ver más transacciones
            </button>
          )}
        </motion.div>

        {/* Financial Goals */}
        <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#f99e02]" />
              <h3 className="text-sm font-semibold text-white">Metas financieras</h3>
            </div>
            <button onClick={() => setShowGoalModal(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-[11px] font-semibold border-none cursor-pointer transition-colors">
              <Plus size={12} /> Nueva
            </button>
          </div>
          {goals.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-white/20 text-xs">Sin metas configuradas</div>
          ) : (
            <div className="space-y-4">
              {goals.map((g) => {
                const current = Math.max(parseFloat(g.current_amount || 0), summary.balance);
                const target = parseFloat(g.target_amount);
                const pct = Math.min(100, Math.round((current / target) * 100));
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-white/70">{g.name}</span>
                      <span className="text-xs text-white/40">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: g.color }} />
                    </div>
                    <p className="text-[11px] text-white/30 mt-1">${current.toLocaleString()} / ${target.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.form initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} onSubmit={handleCreateTransaction} className="w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Nueva Transacción</h2>
                <button type="button" onClick={() => setShowModal(false)} className="text-white/30 hover:text-white/60 bg-transparent border-none cursor-pointer"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {["expense", "income"].map((t) => (
                    <button key={t} type="button" onClick={() => setNewTx({ ...newTx, type: t })} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-none cursor-pointer transition-all ${newTx.type === t ? (t === "income" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400") : "bg-white/5 text-white/40"}`}>
                      {t === "income" ? "Ingreso" : "Gasto"}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Monto</label>
                  <input type="number" required min="0.01" step="0.01" value={newTx.amount} onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })} placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f99e02]/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Categoría</label>
                  <select required value={newTx.category} onChange={(e) => setNewTx({ ...newTx, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#f99e02]/50 transition-colors cursor-pointer mb-2">
                    <option value="" className="bg-[#141414]" disabled>Seleccionar...</option>
                    <optgroup label="Comunes" className="bg-[#141414]">
                      {newTx.type === "expense" ? (
                        <>
                          <option value="Comida" className="bg-[#141414]">Comida</option>
                          <option value="Transporte" className="bg-[#141414]">Transporte</option>
                          <option value="Servicios" className="bg-[#141414]">Servicios</option>
                          <option value="Entretenimiento" className="bg-[#141414]">Entretenimiento</option>
                          <option value="Educación" className="bg-[#141414]">Educación</option>
                        </>
                      ) : (
                        <>
                          <option value="Salario" className="bg-[#141414]">Salario</option>
                          <option value="Ventas" className="bg-[#141414]">Ventas</option>
                          <option value="Freelance" className="bg-[#141414]">Freelance</option>
                          <option value="Regalos" className="bg-[#141414]">Regalos</option>
                        </>
                      )}
                    </optgroup>
                    {categories.length > 0 && (
                      <optgroup label="Personalizadas" className="bg-[#141414]">
                        {categories.map((c) => <option key={c.id} value={c.name} className="bg-[#141414]">{c.name}</option>)}
                      </optgroup>
                    )}
                    <option value="Otro" className="bg-[#141414] font-semibold text-[#f99e02]">Otro (escribir...)</option>
                  </select>
                  {newTx.category === "Otro" && (
                    <input type="text" required value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Escribe la categoría..." className="w-full bg-white/5 border border-[#f99e02]/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f99e02]/50 transition-colors mt-2" />
                  )}
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Descripción</label>
                  <input type="text" required value={newTx.description} onChange={(e) => setNewTx({ ...newTx, description: e.target.value })} placeholder="¿En qué fue?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f99e02]/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Fecha</label>
                  <input type="date" value={newTx.date} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#f99e02]/50 transition-colors" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:bg-white/5 transition-colors bg-transparent cursor-pointer">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#f99e02] hover:bg-[#e08e02] text-white text-sm font-semibold border-none cursor-pointer transition-colors disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </motion.form>
          </motion.div>
        )}

        {showGoalModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowGoalModal(false)}>
            <motion.form initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} onSubmit={handleCreateGoal} className="w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Nueva Meta Financiera</h2>
                <button type="button" onClick={() => setShowGoalModal(false)} className="text-white/30 hover:text-white/60 bg-transparent border-none cursor-pointer"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Ícono de la meta</label>
                  <div className="flex flex-wrap gap-2">
                    {goalIcons.map((ic) => (
                      <button
                        key={ic.emoji}
                        type="button"
                        onClick={() => setNewGoal({ ...newGoal, icon: ic.emoji })}
                        title={ic.label}
                        className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer ${newGoal.icon === ic.emoji ? "bg-white/10 border-white/30 scale-110" : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"}`}
                      >
                        {ic.emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Nombre de la meta (ej. Celular nuevo)</label>
                  <input type="text" required value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="¿Qué quieres comprar?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f99e02]/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Costo / Objetivo ($)</label>
                  <input type="number" required min="1" step="0.01" value={newGoal.targetAmount} onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })} placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f99e02]/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Color de la barra</label>
                  <div className="flex gap-2">
                    {['#f99e02', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                      <button key={c} type="button" onClick={() => setNewGoal({...newGoal, color: c})} className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${newGoal.color === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowGoalModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:bg-white/5 transition-colors bg-transparent cursor-pointer">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white text-sm font-semibold border-none cursor-pointer transition-colors disabled:opacity-50">{saving ? "Guardando..." : "Crear Meta"}</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
