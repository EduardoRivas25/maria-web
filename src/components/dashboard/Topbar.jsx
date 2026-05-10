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
} from "lucide-react";
import { mockNotifications, mockUser } from "@/data/mockData";

const pageTitles = {
  "/dashboard": "Inicio",
  "/dashboard/tareas": "Tareas",
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
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = mockNotifications.filter((n) => !n.read).length;
  const currentTitle = pageTitles[location.pathname] || "Dashboard";

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-white/5"
      style={{ background: "rgba(10, 10, 11, 0.8)", backdropFilter: "blur(20px)" }}
    >
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
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center
                               w-5 h-5 text-[10px] font-bold text-white bg-[#f99e02] rounded-full
                               shadow-[0_0_10px_rgba(249,158,2,0.4)]">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-12 w-80 rounded-2xl border border-white/10
                           bg-[#141414] shadow-2xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map((notif) => {
                    const Icon = notifIcons[notif.type] || Bell;
                    return (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-none
                          ${!notif.read ? "bg-[#f99e02]/5" : ""}`}
                      >
                        <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-lg ${!notif.read ? "bg-[#f99e02]/20 text-[#f99e02]" : "bg-white/5 text-white/40"}`}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${!notif.read ? "text-white" : "text-white/60"}`}>
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-white/30 mt-1">{notif.time}</p>
                        </div>
                        {!notif.read && (
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-[#f99e02] mt-1.5" />
                        )}
                      </div>
                    );
                  })}
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
              {mockUser.initials}
            </div>
            <span className="text-sm text-white/70 font-medium hidden md:block">{mockUser.name}</span>
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
                  <p className="text-sm font-semibold text-white">{mockUser.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{mockUser.email}</p>
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
