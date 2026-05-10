import { useState } from "react";
import { motion } from "framer-motion";
import { User, Moon, Bell, Shield, Palette } from "lucide-react";
import { mockUser } from "@/data/mockData";

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SettingsPage() {
  const [name, setName] = useState(mockUser.name);
  const [email] = useState(mockUser.email);
  const [notifs, setNotifs] = useState(true);

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="max-w-2xl space-y-6">
      {/* Profile */}
      <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-[#f99e02]/10"><User size={16} className="text-[#f99e02]" /></div>
          <h3 className="text-sm font-semibold text-white">Perfil</h3>
        </div>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f99e02] to-[#e08e02] flex items-center justify-center text-white text-xl font-bold shadow-[0_0_25px_rgba(249,158,2,0.2)]">
            {mockUser.initials}
          </div>
          <div>
            <p className="text-white font-semibold">{name}</p>
            <p className="text-xs text-white/40 mt-0.5">{email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 font-medium block mb-1.5">Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#f99e02]/50 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-white/50 font-medium block mb-1.5">Correo electrónico</label>
            <input type="email" value={email} readOnly className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white/40 outline-none cursor-not-allowed" />
          </div>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-purple-500/10"><Palette size={16} className="text-purple-400" /></div>
          <h3 className="text-sm font-semibold text-white">Apariencia</h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon size={16} className="text-white/40" />
            <div>
              <p className="text-sm text-white/70">Tema oscuro</p>
              <p className="text-xs text-white/30">Siempre activado</p>
            </div>
          </div>
          <div className="w-11 h-6 rounded-full bg-[#f99e02] flex items-center px-0.5 cursor-pointer">
            <div className="w-5 h-5 rounded-full bg-white shadow-md ml-auto" />
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-blue-500/10"><Bell size={16} className="text-blue-400" /></div>
          <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: "Tareas próximas a vencer", sub: "Recordatorio 1 día antes" },
            { label: "Eventos del calendario", sub: "30 minutos antes" },
            { label: "Correos importantes", sub: "En tiempo real" },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">{n.label}</p>
                <p className="text-xs text-white/30">{n.sub}</p>
              </div>
              <button onClick={() => setNotifs(!notifs)} className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer border-none transition-colors ${notifs ? "bg-[#f99e02]" : "bg-white/10"}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all ${notifs ? "ml-auto" : "ml-0"}`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security */}
      <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-emerald-500/10"><Shield size={16} className="text-emerald-400" /></div>
          <h3 className="text-sm font-semibold text-white">Seguridad</h3>
        </div>
        <button className="px-4 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:bg-white/5 transition-colors bg-transparent cursor-pointer">
          Cambiar contraseña
        </button>
      </motion.div>

      {/* Save */}
      <motion.div variants={item} className="flex justify-end">
        <button className="px-6 py-2.5 rounded-xl bg-[#f99e02] hover:bg-[#e08e02] text-white text-sm font-semibold border-none cursor-pointer transition-colors shadow-[0_0_20px_rgba(249,158,2,0.2)]">
          Guardar cambios
        </button>
      </motion.div>
    </motion.div>
  );
}
