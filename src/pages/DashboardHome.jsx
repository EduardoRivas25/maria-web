import { useState, useEffect, useCallback } from "react";
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
  AlertTriangle,
  RefreshCw,
  Loader2,
  Bell,
  Zap,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { dashboardApi } from "@/lib/api/dashboard";
import { calendarApi } from "@/lib/api/calendar";
import { gmailApi } from "@/lib/api/gmail";
import { driveApi } from "@/lib/api/drive";
import { isGoogleConnected } from "@/lib/google-auth";
import { useTasksRealtime, useNotificationsRealtime } from "@/lib/hooks/useRealtime";

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

function CardHeader({ icon: Icon, title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-[#f99e02]/10">
          <Icon size={16} className="text-[#f99e02]" />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="text-xs text-white/30 hover:text-[#f99e02] transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
        >
          Ver todo <ArrowUpRight size={12} />
        </button>
      )}
    </div>
  );
}

// Loading skeleton for cards
function CardSkeleton() {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-md rounded-2xl p-4 sm:p-5 min-w-0"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-white/5 animate-pulse" />
        <div className="w-28 h-4 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="w-full h-8 rounded-lg bg-white/5 animate-pulse" />
        <div className="w-3/4 h-8 rounded-lg bg-white/5 animate-pulse" />
        <div className="w-1/2 h-8 rounded-lg bg-white/5 animate-pulse" />
      </div>
    </motion.div>
  );
}

// Google connection prompt
function GoogleConnectPrompt({ icon: Icon, title }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-4 text-center">
      <div className="p-3 rounded-xl bg-white/5 mb-3">
        <Icon size={20} className="text-white/30" />
      </div>
      <p className="text-xs text-white/40 mb-2">
        Conecta Google para ver {title.toLowerCase()}
      </p>
      <button
        onClick={() => navigate("/dashboard/configuracion")}
        className="text-xs text-[#f99e02] hover:text-[#f99e02]/80 bg-[#f99e02]/10 
                   px-3 py-1.5 rounded-lg transition-colors border-none cursor-pointer"
      >
        Conectar
      </button>
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

// Format relative time
function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard summary from Insforge (tasks, finances, notifications, productivity)
  const [summary, setSummary] = useState(null);

  // Google API data (only if connected)
  const [events, setEvents] = useState([]);
  const [emails, setEmails] = useState([]);
  const [files, setFiles] = useState([]);
  const [googleConnected, setGoogleConnected] = useState(false);

  // ── Load dashboard data ──────────────────────────────────
  const loadDashboard = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      // Always load Insforge data
      const summaryData = await dashboardApi.getSummary();
      setSummary(summaryData);

      // Check Google connection and load if available
      const connected = isGoogleConnected();
      setGoogleConnected(connected);

      if (connected) {
        const [eventsResult, emailsResult, filesResult] = await Promise.allSettled([
          calendarApi.getUpcoming(7),
          gmailApi.getRecent(4),
          driveApi.getRecent(4),
        ]);

        if (eventsResult.status === 'fulfilled') {
          setEvents(eventsResult.value.slice(0, 3).map((e, i) => ({
            id: e.id,
            title: e.summary || 'Sin título',
            start: e.start?.dateTime ? new Date(e.start.dateTime) : new Date(),
            end: e.end?.dateTime ? new Date(e.end.dateTime) : new Date(),
            color: ['#f99e02', '#3b82f6', '#8b5cf6', '#ef4444', '#10b981'][i % 5],
          })));
        }

        if (emailsResult.status === 'fulfilled') {
          setEmails((emailsResult.value.messages || []).slice(0, 4).map(em => ({
            id: em.id,
            sender: em.from?.replace(/<.*>/, '').trim() || 'Desconocido',
            subject: em.subject || '(Sin asunto)',
            read: !em.isUnread,
          })));
        }

        if (filesResult.status === 'fulfilled') {
          setFiles((filesResult.value.files || []).slice(0, 4).map(f => {
            const mime = f.mimeType || '';
            let type = 'doc';
            if (mime.includes('pdf')) type = 'pdf';
            else if (mime.includes('image')) type = 'image';
            else if (mime.includes('spreadsheet') || mime.includes('excel')) type = 'spreadsheet';
            else if (mime.includes('presentation') || mime.includes('powerpoint')) type = 'presentation';

            return {
              id: f.id,
              name: f.name,
              type,
              size: f.size ? formatBytes(f.size) : '—',
              modified: f.modifiedTime
                ? new Date(f.modifiedTime).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
                : '—',
              url: f.webViewLink,
            };
          }));
        }
      }

      setError(null);
    } catch (err) {
      console.error('[Dashboard] Load error:', err);
      setError('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ── Realtime subscriptions ───────────────────────────────
  useTasksRealtime(user?.id, useCallback(() => {
    // Reload summary when tasks change
    loadDashboard();
  }, [loadDashboard]));

  useNotificationsRealtime(user?.id, {
    onNew: useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  });

  // ── Helpers ──────────────────────────────────────────────
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario';

  const taskCounts = summary?.tasks || { todo: 0, inProgress: 0, done: 0, total: 0 };
  const finance = summary?.finance || { income: 0, expense: 0, balance: 0 };
  const weeklyProductivity = summary?.weeklyProductivity || [];
  const notifications = summary?.notifications || [];
  const unreadCount = summary?.unreadNotifications || 0;

  // Calculate trend percentages (simple heuristic)
  const incomeTrend = finance.income > 0 ? '+' + Math.round(finance.income / 100) + '%' : '0%';
  const expenseTrend = finance.expense > 0 ? '-' + Math.round(finance.expense / 100) + '%' : '0%';
  const balanceTrend = finance.balance >= 0 
    ? '+' + Math.round(Math.abs(finance.balance) / Math.max(finance.income, 1) * 100) + '%'
    : '-' + Math.round(Math.abs(finance.balance) / Math.max(finance.income, 1) * 100) + '%';

  // ── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 max-w-[1400px] w-full"
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </motion.div>
    );
  }

  // ── Error state ──────────────────────────────────────────
  if (error && !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-2xl bg-red-500/10 mb-4">
          <AlertTriangle size={28} className="text-red-400" />
        </div>
        <h3 className="text-white font-semibold mb-2">Error cargando dashboard</h3>
        <p className="text-white/40 text-sm mb-4 max-w-sm">{error}</p>
        <button
          onClick={() => { setLoading(true); loadDashboard(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f99e02]/10 text-[#f99e02] 
                     border-none cursor-pointer hover:bg-[#f99e02]/20 transition-colors text-sm"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 max-w-[1400px] w-full"
    >
      {/* Refreshing indicator */}
      {refreshing && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-[#141414] border border-white/10 
                        rounded-xl px-3 py-2 shadow-xl animate-in slide-in-from-top">
          <Loader2 size={14} className="text-[#f99e02] animate-spin" />
          <span className="text-xs text-white/50">Actualizando...</span>
        </div>
      )}

      {/* ── Upcoming Events ─────────────────────────────── */}
      <Card>
        <CardHeader icon={Calendar} title="Próximos Eventos" action onAction={() => navigate('/dashboard/calendario')} />
        {googleConnected && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
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
        ) : googleConnected ? (
          <div className="flex flex-col items-center py-4 text-center">
            <Calendar size={20} className="text-white/20 mb-2" />
            <p className="text-xs text-white/40">No hay eventos próximos</p>
          </div>
        ) : (
          <GoogleConnectPrompt icon={Calendar} title="tus eventos" />
        )}
      </Card>

      {/* ── Task Summary ────────────────────────────────── */}
      <Card>
        <CardHeader icon={CheckSquare} title="Resumen de Tareas" action onAction={() => navigate('/dashboard/tareas')} />
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Pendientes", count: taskCounts.todo, color: "#f99e02", bg: "bg-[#f99e02]/10" },
            { label: "En progreso", count: taskCounts.inProgress, color: "#3b82f6", bg: "bg-blue-500/10" },
            { label: "Completadas", count: taskCounts.done, color: "#10b981", bg: "bg-emerald-500/10" },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-xl p-2 sm:p-3 text-center flex flex-col justify-center`}>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: item.color }}>{item.count}</p>
              <p className="text-[10px] sm:text-[11px] text-white/50 mt-1 leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Weekly Productivity Chart ───────────────────── */}
      <Card className="lg:row-span-2 flex flex-col">
        <CardHeader icon={TrendingUp} title="Productividad Semanal" />
        {weeklyProductivity.length > 0 ? (
          <div className="flex-1 mt-2 w-full min-h-[220px] sm:min-h-[280px] relative">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyProductivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(249,158,2,0.05)" }} />
                  <Bar dataKey="tareas" name="Tareas Completadas" fill="#f99e02" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <Zap size={24} className="text-white/15 mb-2" />
            <p className="text-xs text-white/30">Completa tareas para ver tu actividad semanal</p>
          </div>
        )}
      </Card>

      {/* ── Financial Summary ───────────────────────────── */}
      <Card>
        <CardHeader icon={DollarSign} title="Resumen Financiero" action onAction={() => navigate('/dashboard/finanzas')} />
        <div className="space-y-3">
          {[
            { label: "Ingresos del mes", value: `$${finance.income.toLocaleString()}`, color: "#10b981", trend: incomeTrend },
            { label: "Gastos del mes", value: `$${finance.expense.toLocaleString()}`, color: "#ef4444", trend: expenseTrend },
            { label: "Balance total", value: `$${finance.balance.toLocaleString()}`, color: "#f99e02", trend: balanceTrend },
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

      {/* ── Recent Emails ───────────────────────────────── */}
      <Card>
        <CardHeader icon={Mail} title="Correos Recientes" action onAction={() => navigate('/dashboard/correos')} />
        {googleConnected && emails.length > 0 ? (
          <div className="space-y-2.5">
            {emails.map((email) => (
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
        ) : googleConnected ? (
          <div className="flex flex-col items-center py-4 text-center">
            <Mail size={20} className="text-white/20 mb-2" />
            <p className="text-xs text-white/40">No hay correos recientes</p>
          </div>
        ) : (
          <GoogleConnectPrompt icon={Mail} title="tus correos" />
        )}
      </Card>

      {/* ── Recent Files (or Notifications if no Google) ── */}
      <Card className="lg:col-span-2">
        {googleConnected ? (
          <>
            <CardHeader icon={FolderOpen} title="Archivos Recientes" action onAction={() => navigate('/dashboard/archivos')} />
            {files.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((file) => {
                  const typeColors = {
                    pdf: "#ef4444",
                    doc: "#3b82f6",
                    image: "#10b981",
                    spreadsheet: "#f99e02",
                    presentation: "#8b5cf6",
                  };
                  return (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer group no-underline"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${typeColors[file.type] || "#6366f1"}15` }}
                      >
                        <FolderOpen size={18} style={{ color: typeColors[file.type] || "#6366f1" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white/70 font-medium truncate group-hover:text-white transition-colors">{file.name}</p>
                        <p className="text-[11px] text-white/30 mt-0.5">{file.size} · {file.modified}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <FolderOpen size={24} className="text-white/15 mb-2" />
                <p className="text-xs text-white/30">No hay archivos recientes</p>
              </div>
            )}
          </>
        ) : (
          <>
            <CardHeader icon={Bell} title="Notificaciones Recientes" />
            {notifications.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notifications.slice(0, 6).map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer
                      ${!notif.read ? 'bg-[#f99e02]/5 hover:bg-[#f99e02]/10' : 'bg-white/[0.02] hover:bg-white/[0.04]'}`}
                    onClick={() => notif.action_url && navigate(notif.action_url)}
                  >
                    <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg 
                      ${!notif.read ? 'bg-[#f99e02]/20 text-[#f99e02]' : 'bg-white/5 text-white/40'}`}>
                      <Bell size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${!notif.read ? 'text-white' : 'text-white/60'}`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-white/25 mt-1">{formatRelativeTime(notif.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <Bell size={20} className="text-white/15 mb-2" />
                <p className="text-xs text-white/30">Sin notificaciones</p>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Quick Welcome Card ──────────────────────────── */}
      <Card className="lg:col-span-1 bg-gradient-to-br from-[#f99e02]/10 to-[#f99e02]/[0.02] border-[#f99e02]/10">
        <div className="flex flex-col items-center text-center py-2">
          <img src="/logomariaM.png" alt="M.A.R.I.A." className="w-12 h-12 mb-3 opacity-80" />
          <h3 className="text-sm font-semibold text-white mb-1">Bienvenido, {displayName}</h3>
          <p className="text-xs text-white/40 leading-relaxed">
            Tienes {taskCounts.todo} tareas pendientes
            {events.length > 0 ? ` y ${events.length} eventos próximos` : ''}.
            {taskCounts.todo === 0 && taskCounts.inProgress === 0
              ? ' ¡Todo en orden! 🎉'
              : ' ¡Vamos a ser productivos! 🚀'}
          </p>
          {unreadCount > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[#f99e02] bg-[#f99e02]/10 px-3 py-1 rounded-full">
              <Bell size={12} />
              <span className="text-[11px] font-medium">{unreadCount} sin leer</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ── Utility ────────────────────────────────────────────────

function formatBytes(bytes) {
  const b = parseInt(bytes, 10);
  if (isNaN(b) || b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
