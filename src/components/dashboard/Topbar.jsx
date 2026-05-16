import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  User,
  Settings,
  LogOut,
  Moon,
  CheckSquare,
  Calendar,
  Clock,
  Menu,
  Mail,
  BookOpen,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSmartNotifications } from "@/lib/hooks/useSmartNotifications";

const pageTitles = {
  "/dashboard": "Inicio",
  "/dashboard/tareas": "Tareas",
  "/dashboard/clases": "Clases",
  "/dashboard/calendario": "Calendario",
  "/dashboard/correos": "Correos",
  "/dashboard/archivos": "Archivos",
  "/dashboard/productividad": "Productividad",
  "/dashboard/finanzas": "Finanzas",
  "/dashboard/configuracion": "Configuración",
};

const notifIcons = {
  task: CheckSquare,
  event: Calendar,
  reminder: Clock,
  email: Mail,
  classroom: BookOpen,
};

const notifColors = {
  task: { bg: "bg-[#f99e02]/20", text: "text-[#f99e02]" },
  event: { bg: "bg-blue-500/20", text: "text-blue-400" },
  reminder: { bg: "bg-purple-500/20", text: "text-purple-400" },
  email: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  classroom: { bg: "bg-indigo-500/20", text: "text-indigo-400" },
};

export default function Topbar({ isMobile, onOpenMobileMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading: notifsLoading,
    markAsRead,
    markAllAsRead,
    refresh: refreshNotifs,
  } = useSmartNotifications();

  const currentTitle = pageTitles[location.pathname] || "Dashboard";
  const displayName = profile?.full_name || user?.email?.split('@')[0] || "Usuario";
  const displayEmail = profile?.email || user?.email || "";
  const initials = displayName.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2) || "U";

  // ── Handle notification click ─────────────────────────────
  const handleNotifClick = (notif) => {
    markAsRead(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
      setShowNotifs(false);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-white/5"
      style={{ background: "rgba(10, 10, 11, 0.8)", backdropFilter: "blur(20px)" }}
    >
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onOpenMobileMenu}
            className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
          >
            <Menu size={24} />
          </button>
        )}
        {/* Page Title */}
        <motion.h1
          key={currentTitle}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-lg font-semibold text-white"
        >
          {currentTitle}
        </motion.h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
            className="relative flex items-center justify-center w-10 h-10 rounded-xl
                       text-white/60 hover:text-white hover:bg-white/5
                       transition-all duration-200 bg-transparent border-none cursor-pointer"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center
                           w-5 h-5 text-[10px] font-bold text-white bg-[#f99e02] rounded-full
                           shadow-[0_0_10px_rgba(249,158,2,0.4)]"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl border border-white/10
                           bg-[#141414] shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-[#f99e02] bg-[#f99e02]/10 px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Refresh button */}
                    <button
                      onClick={refreshNotifs}
                      className="p-1 text-white/30 hover:text-white/60 bg-transparent border-none 
                                 cursor-pointer transition-colors rounded-lg hover:bg-white/5"
                      title="Actualizar"
                    >
                      <RefreshCw size={12} className={notifsLoading ? 'animate-spin' : ''} />
                    </button>
                    {/* Mark all read */}
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-[#f99e02] hover:text-[#f99e02]/80 bg-transparent 
                                   border-none cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle size={10} />
                        Marcar todo leído
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => {
                      const Icon = notifIcons[notif.type] || Bell;
                      const colors = notifColors[notif.type] || notifColors.task;
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotifClick(notif)}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors 
                                     cursor-pointer border-b border-white/[0.03] last:border-none
                                     ${!notif.read ? "bg-white/[0.02]" : ""}`}
                        >
                          <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg 
                            ${!notif.read ? colors.bg + ' ' + colors.text : "bg-white/5 text-white/30"}`}>
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-medium truncate ${!notif.read ? "text-white" : "text-white/50"}`}>
                                {notif.title}
                              </p>
                              {notif.isNew && (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 
                                                 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  NUEVO
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-[10px] text-white/25 mt-1">{notif.time}</p>
                          </div>
                          {!notif.read && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#f99e02] mt-1.5" />
                          )}
                        </div>
                      );
                    })
                  ) : notifsLoading ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="w-6 h-6 border-2 border-[#f99e02] border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-xs text-white/30">Revisando...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="p-3 rounded-xl bg-emerald-500/10 mb-3">
                        <CheckCircle size={20} className="text-emerald-400" />
                      </div>
                      <p className="text-xs text-white/50 font-medium">¡Todo en orden!</p>
                      <p className="text-[11px] text-white/25 mt-1">No tienes pendientes por ahora</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl
                       hover:bg-white/5 transition-all duration-200
                       bg-transparent border-none cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f99e02] to-[#e08e02]
                            flex items-center justify-center text-white text-xs font-bold
                            shadow-[0_0_15px_rgba(249,158,2,0.2)]">
              {initials}
            </div>
            <span className="text-sm text-white/70 font-medium hidden md:block">{displayName}</span>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-12 w-56 rounded-2xl border border-white/10
                           bg-[#141414] shadow-2xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-semibold text-white">{displayName}</p>
                  <p className="text-xs text-white/40 mt-0.5">{displayEmail}</p>
                </div>
                <div className="py-1">
                  {[
                    { icon: User, label: "Perfil", onClick: () => navigate("/dashboard/configuracion") },
                    { icon: Settings, label: "Configuración", onClick: () => navigate("/dashboard/configuracion") },
                    { icon: Moon, label: "Tema oscuro", badge: "ON" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.onClick?.(); setShowProfile(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white
                                 hover:bg-white/5 transition-all duration-200
                                 bg-transparent border-none cursor-pointer text-left"
                    >
                      <item.icon size={16} />
                      <span className="text-sm flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-bold text-[#f99e02] bg-[#f99e02]/10 px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-white/5 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400/80 hover:text-red-400
                               hover:bg-red-500/5 transition-all duration-200
                               bg-transparent border-none cursor-pointer text-left"
                  >
                    <LogOut size={16} />
                    <span className="text-sm">Cerrar sesión</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
