import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Star, Archive, Eye, StarOff, Search } from "lucide-react";
import { mockEmails } from "@/data/mockData";

export default function EmailPage() {
  const [emails, setEmails] = useState(mockEmails);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selected = emails.find((e) => e.id === selectedId);
  const filtered = emails.filter((e) => !searchQuery || e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || e.sender.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleStar = (id, ev) => { ev.stopPropagation(); setEmails((prev) => prev.map((e) => e.id === id ? { ...e, starred: !e.starred } : e)); };
  const markRead = (id) => setEmails((prev) => prev.map((e) => e.id === id ? { ...e, read: true } : e));

  const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  return (
    <div className="max-w-[1400px] flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 w-full sm:w-80">
          <Search size={14} className="text-white/30" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar correos..." className="bg-transparent border-none outline-none text-sm text-white placeholder-white/30 flex-1" />
        </div>
        <p className="text-xs text-white/30">{emails.filter((e) => !e.read).length} no leídos</p>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr] gap-5 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden hide-scrollbar">
        {/* Email List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden flex flex-col h-[400px] lg:h-auto shrink-0 lg:shrink">
          <div className="overflow-y-auto flex-1 hide-scrollbar">
            {filtered.map((email) => (
              <div
                key={email.id}
                onClick={() => { setSelectedId(email.id); markRead(email.id); }}
                className={`flex items-start gap-3 px-5 py-4 border-b border-white/[0.04] cursor-pointer transition-all duration-200 hover:bg-white/[0.03]
                  ${selectedId === email.id ? "bg-[#f99e02]/5 border-l-2 border-l-[#f99e02]" : ""}
                  ${!email.read ? "bg-white/[0.02]" : ""}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5 ${!email.read ? "bg-[#f99e02]/20 text-[#f99e02]" : "bg-white/5 text-white/30"}`}>
                  {email.sender.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-medium truncate ${!email.read ? "text-white" : "text-white/50"}`}>{email.sender}</p>
                    <span className="text-[11px] text-white/25 flex-shrink-0">{formatDate(email.date)}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${!email.read ? "text-white/70" : "text-white/40"}`}>{email.subject}</p>
                  <p className="text-xs text-white/25 truncate mt-0.5">{email.preview}</p>
                </div>
                <button onClick={(ev) => toggleStar(email.id, ev)} className="mt-1 bg-transparent border-none cursor-pointer p-0">
                  {email.starred ? <Star size={14} className="text-[#f99e02] fill-[#f99e02]" /> : <Star size={14} className="text-white/15 hover:text-white/30" />}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Email Preview */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden flex flex-col min-h-[500px] lg:min-h-0 flex-1">
          {selected ? (
            <div className="flex flex-col h-full">
              <div className="px-6 py-5 border-b border-white/[0.04]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-white">{selected.subject}</h2>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => toggleStar(selected.id, e)} className="p-2 rounded-lg hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer">
                      {selected.starred ? <Star size={16} className="text-[#f99e02] fill-[#f99e02]" /> : <Star size={16} className="text-white/30" />}
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer text-white/30"><Archive size={16} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f99e02]/20 flex items-center justify-center text-[11px] font-bold text-[#f99e02]">
                    {selected.sender.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm text-white/80 font-medium">{selected.sender}</p>
                    <p className="text-xs text-white/30">{selected.senderEmail}</p>
                  </div>
                  <span className="ml-auto text-xs text-white/25">{formatDate(selected.date)}</span>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <p className="text-sm text-white/60 leading-relaxed">{selected.preview}</p>
                <p className="text-sm text-white/40 leading-relaxed mt-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/15">
              <Mail size={40} className="mb-3" />
              <p className="text-sm">Selecciona un correo para ver</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
