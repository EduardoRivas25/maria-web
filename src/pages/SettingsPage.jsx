import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Moon, Bell, Shield, Palette, Loader2, Check, LogOut, Link2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { settingsApi } from "@/lib/api/settings";
import { isGoogleConnected, connectGoogle, clearGoogleToken } from "@/lib/google-auth";

const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SettingsPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initials, setInitials] = useState("");
  const [notifSettings, setNotifSettings] = useState({ tasks: true, events: true, emails: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [googleConnected, setGoogleConnected] = useState(isGoogleConnected());
  const [googleConnecting, setGoogleConnecting] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setEmail(profile.email || user?.email || "");
      const parts = (profile.full_name || "").split(" ");
      setInitials(parts.map(p => p[0]).join("").toUpperCase().slice(0, 2) || "U");
      const s = profile.settings || {};
      setNotifSettings(s.notifications || { tasks: true, events: true, emails: true });
      setLoading(false);
    } else if (user) {
      setEmail(user.email || "");
      setInitials("U");
      setLoading(false);
    }
  }, [profile, user]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await settingsApi.updateProfile({ fullName: name });
      await settingsApi.updateSettings({ notifications: notifSettings });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("[Settings] Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (newPassword.length < 6) { setPasswordMsg("Mínimo 6 caracteres"); return; }
    setPasswordSaving(true);
    setPasswordMsg("");
    try {
      await settingsApi.changePassword(newPassword);
      setPasswordMsg("✅ Contraseña actualizada");
      setNewPassword("");
      setPasswordMode(false);
    } catch (err) {
      setPasswordMsg("Error: " + (err.message || "No se pudo cambiar"));
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleSignOut() {
    try { await signOut(); } catch (err) { console.error("[Settings] Logout error:", err); }
  }

  function toggleNotif(key) {
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div className="max-w-2xl flex items-center justify-center py-20">
        <Loader2 size={24} className="text-[#f99e02] animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="max-w-2xl space-y-6">
      {/* Profile */}
      <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-[#f99e02]/10"><User size={16} className="text-[#f99e02]" /></div>
          <h3 className="text-sm font-semibold text-white">Perfil</h3>
        </div>
        <div className="flex items-center gap-5 mb-6">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f99e02] to-[#e08e02] flex items-center justify-center text-white text-xl font-bold shadow-[0_0_25px_rgba(249,158,2,0.2)]">
              {initials}
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{name || "Sin nombre"}</p>
            <p className="text-xs text-white/40 mt-0.5">{email}</p>
            {profile?.auth_provider && profile.auth_provider !== "email" && (
              <p className="text-[10px] text-white/25 mt-1">Conectado vía {profile.auth_provider}</p>
            )}
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
            { key: "tasks", label: "Tareas próximas a vencer", sub: "Recordatorio 1 día antes" },
            { key: "events", label: "Eventos del calendario", sub: "30 minutos antes" },
            { key: "emails", label: "Correos importantes", sub: "En tiempo real" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">{n.label}</p>
                <p className="text-xs text-white/30">{n.sub}</p>
              </div>
              <button onClick={() => toggleNotif(n.key)} className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer border-none transition-colors ${notifSettings[n.key] ? "bg-[#f99e02]" : "bg-white/10"}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all ${notifSettings[n.key] ? "ml-auto" : "ml-0"}`} />
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
        {!passwordMode ? (
          <button onClick={() => setPasswordMode(true)} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:bg-white/5 transition-colors bg-transparent cursor-pointer">
            Cambiar contraseña
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nueva contraseña (mínimo 6 caracteres)" minLength={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f99e02]/50 transition-colors" />
            {passwordMsg && <p className={`text-xs ${passwordMsg.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>{passwordMsg}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setPasswordMode(false); setNewPassword(""); setPasswordMsg(""); }} className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-xs hover:bg-white/5 bg-transparent cursor-pointer border-none">Cancelar</button>
              <button type="submit" disabled={passwordSaving} className="px-4 py-2 rounded-xl bg-[#f99e02] hover:bg-[#e08e02] text-white text-xs font-semibold border-none cursor-pointer disabled:opacity-50">{passwordSaving ? "Guardando..." : "Actualizar"}</button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Google Connection */}
      <motion.div variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-blue-500/10"><Link2 size={16} className="text-blue-400" /></div>
          <h3 className="text-sm font-semibold text-white">Cuenta de Google</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Google (Classroom, Calendar, Drive, Gmail)</p>
            <p className="text-xs text-white/30">{googleConnected ? 'Conectada' : 'No conectada'}</p>
          </div>
          {googleConnected ? (
            <button
              onClick={() => { clearGoogleToken(); setGoogleConnected(false); }}
              className="px-4 py-2 rounded-xl border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/10 transition-colors bg-transparent cursor-pointer"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={async () => {
                setGoogleConnecting(true);
                try {
                  await connectGoogle();
                  setGoogleConnected(true);
                } catch (err) {
                  console.error('[Settings] Google connect error:', err);
                } finally {
                  setGoogleConnecting(false);
                }
              }}
              disabled={googleConnecting}
              className="px-4 py-2 rounded-xl bg-[#f99e02] hover:bg-[#e08e02] text-white text-xs font-semibold border-none cursor-pointer transition-colors disabled:opacity-50"
            >
              {googleConnecting ? 'Conectando...' : 'Conectar'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Save + Logout */}
      <motion.div variants={item} className="flex items-center justify-between">
        <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors bg-transparent cursor-pointer">
          <LogOut size={14} /> Cerrar sesión
        </button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#f99e02] hover:bg-[#e08e02] text-white text-sm font-semibold border-none cursor-pointer transition-colors shadow-[0_0_20px_rgba(249,158,2,0.2)] disabled:opacity-50">
          {saved ? <><Check size={14} /> Guardado</> : saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </motion.div>
    </motion.div>
  );
}
