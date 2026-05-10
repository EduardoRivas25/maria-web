import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mic } from "lucide-react";

export default function MariaBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <>
      {/* Floating Bubble */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full border-none cursor-pointer
                   bg-gradient-to-br from-[#f99e02] to-[#e08e02] shadow-[0_0_30px_rgba(249,158,2,0.35)]
                   flex items-center justify-center overflow-hidden"
        style={{ padding: 0 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} className="text-white" />
            </motion.div>
          ) : (
            <motion.img
              key="logo"
              src="/logomariaM.png"
              alt="M.A.R.I.A."
              className="w-9 h-9 object-contain"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full border-2 border-[#f99e02]/40 animate-ping pointer-events-none" />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[380px] h-[500px] rounded-2xl
                       border border-white/10 bg-[#0d0d0d]/95 backdrop-blur-xl
                       shadow-[0_0_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5
                            bg-gradient-to-r from-[#f99e02]/10 to-transparent">
              <div className="relative">
                <img src="/logomariaM.png" alt="M.A.R.I.A." className="w-8 h-8 object-contain" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0d0d0d]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">M.A.R.I.A.</h3>
                <p className="text-[11px] text-emerald-400/80">En línea</p>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Welcome message */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#f99e02]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <img src="/logomariaM.png" alt="" className="w-4 h-4 object-contain" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-white/80 leading-relaxed">
                    ¡Hola! 👋 Soy <span className="text-[#f99e02] font-semibold">M.A.R.I.A.</span>, tu asistente inteligente. ¿En qué puedo ayudarte hoy?
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#f99e02]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <img src="/logomariaM.png" alt="" className="w-4 h-4 object-contain" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                  <p className="text-[13px] text-white/60 leading-relaxed">
                    Puedo ayudarte a gestionar tareas, revisar tu calendario, organizar archivos y mucho más. Solo escribe tu solicitud.
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe un comando..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-white/30"
                />
                <button className="p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-colors bg-transparent border-none cursor-pointer">
                  <Mic size={16} />
                </button>
                <button className="p-1.5 rounded-lg text-[#f99e02] hover:bg-[#f99e02]/10 transition-colors bg-transparent border-none cursor-pointer">
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[10px] text-white/20 mt-2 text-center">
                Impulsado por Gemini 3 · Voz próximamente
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
