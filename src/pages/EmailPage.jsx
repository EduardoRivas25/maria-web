import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, Star, Archive, Search, Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { gmailApi } from "@/lib/api/gmail";
import { isGoogleConnected } from "@/lib/google-auth";
import GoogleConnectPrompt from "@/components/GoogleConnectPrompt";

export default function EmailPage() {
  const [emails, setEmails] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [fullMessage, setFullMessage] = useState(null);
  const [needsGoogle, setNeedsGoogle] = useState(!isGoogleConnected());

  const fetchEmails = useCallback(async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const response = await gmailApi.listEmails({ maxResults: 20, q: query });
      setEmails(response.messages || []);
    } catch (err) {
      console.error("[Email] Load error:", err);
      if (err.message === 'NO_GOOGLE_TOKEN') {
        setNeedsGoogle(true);
      } else {
        setError('Error al cargar los correos.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!needsGoogle) fetchEmails();
  }, [fetchEmails, needsGoogle]);

  // Handle search with simple debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmails(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchEmails]);

  const handleSelect = async (id) => {
    setSelectedId(id);
    setLoadingDetails(true);
    setFullMessage(null);
    
    // Optimistic read mark
    setEmails(prev => prev.map(e => e.id === id ? { ...e, isUnread: false } : e));

    try {
      const msg = await gmailApi.getEmail(id);
      setFullMessage(msg);
    } catch (err) {
      console.error("Error fetching email details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleStar = (id, ev) => { 
    ev.stopPropagation(); 
    setEmails((prev) => prev.map((e) => e.id === id ? { ...e, isStarred: !e.isStarred } : e)); 
    // In a real app, we'd also call an API to modify labels
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  const parseFrom = (fromStr) => {
    if (!fromStr) return { name: 'Desconocido', email: '' };
    const match = fromStr.match(/(.*?)\s*<(.+)>/);
    if (match) return { name: match[1].replace(/"/g, ''), email: match[2] };
    return { name: fromStr, email: fromStr };
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(/[\s_-]+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  };

  const selectedListEmail = emails.find((e) => e.id === selectedId);

  // Helper to extract body from fullMessage payload
  const getMessageBody = (payload) => {
    if (!payload) return "";
    let body = "";
    if (payload.parts) {
      const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
      const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
      const targetPart = htmlPart || textPart || payload.parts[0];
      if (targetPart && targetPart.body && targetPart.body.data) {
        body = atob(targetPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    } else if (payload.body && payload.body.data) {
      body = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
    return body;
  };

  return (
    <div className="max-w-[1400px] flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 w-full sm:w-80">
          <Search size={14} className="text-white/30" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar correos..." className="bg-transparent border-none outline-none text-sm text-white placeholder-white/30 flex-1" />
        </div>
        <p className="text-xs text-white/30">{emails.filter((e) => e.isUnread).length} no leídos</p>
      </div>

      {needsGoogle ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <GoogleConnectPrompt
            serviceName="Gmail"
            onConnected={() => { setNeedsGoogle(false); setLoading(true); fetchEmails(); }}
          />
        </div>
      ) : error ? (
        <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center text-center p-8">
          <AlertCircle size={32} className="text-red-400 mb-3" />
          <p className="text-red-400 font-medium mb-1">No se pudo cargar Gmail</p>
          <p className="text-sm text-red-400/70">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 size={32} className="text-[#f99e02] animate-spin mb-4" />
          <p className="text-white/40 text-sm">Cargando bandeja de entrada...</p>
        </div>
      ) : (
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr] gap-5 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden hide-scrollbar">
          {/* Email List */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden flex-col shrink-0 lg:shrink ${selectedId ? 'hidden lg:flex lg:flex-1' : 'flex flex-1'}`}>
            <div className="overflow-y-auto flex-1 hide-scrollbar">
              {emails.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/20 text-sm">No se encontraron correos</div>
              ) : emails.map((email) => {
                const { name } = parseFrom(email.from);
                return (
                  <div
                    key={email.id}
                    onClick={() => handleSelect(email.id)}
                    className={`flex items-start gap-3 px-5 py-4 border-b border-white/[0.04] cursor-pointer transition-all duration-200 hover:bg-white/[0.03]
                      ${selectedId === email.id ? "bg-[#f99e02]/5 border-l-2 border-l-[#f99e02]" : "border-l-2 border-l-transparent"}
                      ${email.isUnread ? "bg-white/[0.02]" : ""}`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5 ${email.isUnread ? "bg-[#f99e02]/20 text-[#f99e02]" : "bg-white/5 text-white/30"}`}>
                      {getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${email.isUnread ? "text-white" : "text-white/50"}`}>{name}</p>
                        <span className="text-[11px] text-white/25 flex-shrink-0">{formatDate(email.date)}</span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${email.isUnread ? "text-white/70 font-medium" : "text-white/40"}`}>{email.subject}</p>
                      <p className="text-xs text-white/25 truncate mt-0.5" dangerouslySetInnerHTML={{ __html: email.snippet }}></p>
                    </div>
                    <button onClick={(ev) => toggleStar(email.id, ev)} className="mt-1 bg-transparent border-none cursor-pointer p-0 flex-shrink-0">
                      {email.isStarred ? <Star size={14} className="text-[#f99e02] fill-[#f99e02]" /> : <Star size={14} className="text-white/15 hover:text-white/30" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Email Preview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className={`bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-hidden flex-col flex-1 ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
            {selectedListEmail ? (
              <div className="flex flex-col h-full">
                <div className="px-6 py-5 border-b border-white/[0.04]">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <button onClick={() => setSelectedId(null)} className="lg:hidden p-1.5 -ml-2 -mt-1 rounded-lg hover:bg-white/5 transition-colors text-white/50 hover:text-white bg-transparent border-none cursor-pointer flex-shrink-0">
                        <ChevronLeft size={20} />
                      </button>
                      <h2 className="text-base font-bold text-white leading-tight mt-0.5">{selectedListEmail.subject}</h2>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                      <button onClick={(e) => toggleStar(selectedListEmail.id, e)} className="p-2 rounded-lg hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer">
                        {selectedListEmail.isStarred ? <Star size={16} className="text-[#f99e02] fill-[#f99e02]" /> : <Star size={16} className="text-white/30" />}
                      </button>
                      <button className="p-2 rounded-lg hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer text-white/30"><Archive size={16} /></button>
                    </div>
                  </div>
                  {(() => {
                    const { name, email: senderEmail } = parseFrom(selectedListEmail.from);
                    return (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f99e02]/20 flex items-center justify-center text-[11px] font-bold text-[#f99e02]">
                          {getInitials(name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white/80 font-medium truncate">{name}</p>
                          <p className="text-[10px] text-white/30 truncate">{senderEmail}</p>
                        </div>
                        <span className="ml-auto text-xs text-white/25 flex-shrink-0">{formatDate(selectedListEmail.date)}</span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-white/[0.01]">
                  {loadingDetails ? (
                    <div className="flex justify-center py-10">
                      <Loader2 size={24} className="text-[#f99e02] animate-spin" />
                    </div>
                  ) : fullMessage ? (
                    <div className="text-sm text-white/70 leading-relaxed max-w-full overflow-hidden prose prose-invert prose-p:my-2 prose-a:text-[#f99e02]">
                      {(() => {
                        const htmlBody = getMessageBody(fullMessage.payload);
                        if (htmlBody) {
                          // Simple sanitization for display
                          return <div dangerouslySetInnerHTML={{ __html: htmlBody.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") }} />;
                        }
                        return <p>{selectedListEmail.snippet}</p>;
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60 leading-relaxed">{selectedListEmail.snippet}</p>
                  )}
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
      )}
    </div>
  );
}
