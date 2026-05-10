import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  CheckSquare,
  Calendar,
  Mail,
  FolderOpen,
  BarChart3,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: Home, label: "Inicio", end: true },
  { to: "/dashboard/tareas", icon: CheckSquare, label: "Tareas" },
  { to: "/dashboard/calendario", icon: Calendar, label: "Calendario" },
  { to: "/dashboard/correos", icon: Mail, label: "Correos" },
  { to: "/dashboard/archivos", icon: FolderOpen, label: "Archivos" },
  { to: "/dashboard/productividad", icon: BarChart3, label: "Productividad" },
  { to: "/dashboard/finanzas", icon: Wallet, label: "Finanzas" },
  { to: "/dashboard/configuracion", icon: Settings, label: "Configuración" },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-white/5"
      style={{ background: "#0d0d0d" }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/5">
        <NavLink to="/dashboard" className="flex items-center gap-3 no-underline">
          <img
            src="/logomariaM.png"
            alt="M.A.R.I.A."
            className="h-9 w-9 object-contain flex-shrink-0"
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-white font-bold text-lg tracking-wide whitespace-nowrap overflow-hidden"
              >
                M.A.R.I.A.
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="no-underline block"
            >
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                  transition-colors duration-200 group
                  ${isActive
                    ? "bg-[#f99e02]/15 text-[#f99e02]"
                    : "text-white/50 hover:text-white/90 hover:bg-white/5"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#f99e02]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}

                <Icon
                  size={20}
                  className={`flex-shrink-0 transition-colors duration-200 ${
                    isActive ? "text-[#f99e02]" : "text-white/50 group-hover:text-white/90"
                  }`}
                />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                     text-white/40 hover:text-white/80 hover:bg-white/5
                     transition-all duration-200 bg-transparent border-none cursor-pointer"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-medium whitespace-nowrap overflow-hidden"
              >
                Colapsar
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
