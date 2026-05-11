import { useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, FileText, Image, FileSpreadsheet, Film, Presentation, Grid3X3, List, Download, Trash2, Eye, Search } from "lucide-react";
import { mockFiles } from "@/data/mockData";

const typeIcons = { pdf: FileText, doc: FileText, image: Image, spreadsheet: FileSpreadsheet, video: Film, presentation: Presentation };
const typeColors = { pdf: "#ef4444", doc: "#3b82f6", image: "#10b981", spreadsheet: "#f99e02", video: "#8b5cf6", presentation: "#ec4899" };

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function FilesPage() {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = mockFiles.filter((f) => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 w-full sm:w-72">
            <Search size={14} className="text-white/30" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar archivos..." className="bg-transparent border-none outline-none text-sm text-white placeholder-white/30 flex-1" />
          </div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-white/30">
            <span className="text-[#f99e02]">Mi Drive</span>
            <span>/</span>
            <span>Proyecto M.A.R.I.A.</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 self-start sm:self-auto">
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all border-none cursor-pointer ${viewMode === "grid" ? "bg-[#f99e02]/15 text-[#f99e02]" : "text-white/40 hover:text-white/70 bg-transparent"}`}><Grid3X3 size={14} /></button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all border-none cursor-pointer ${viewMode === "list" ? "bg-[#f99e02]/15 text-[#f99e02]" : "text-white/40 hover:text-white/70 bg-transparent"}`}><List size={14} /></button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((file) => {
            const Icon = typeIcons[file.type] || FileText;
            const color = typeColors[file.type] || "#6366f1";
            return (
              <motion.div key={file.id} variants={item} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 hover:shadow-[0_0_30px_rgba(249,158,2,0.04)] transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl mx-auto mb-4" style={{ background: `${color}12` }}>
                  <Icon size={28} style={{ color }} />
                </div>
                <h4 className="text-sm font-medium text-white/80 text-center truncate group-hover:text-white transition-colors">{file.name}</h4>
                <p className="text-xs text-white/30 text-center mt-1">{file.size} · {file.modified}</p>
                {file.shared && <p className="text-[10px] text-[#f99e02]/60 text-center mt-2">Compartido</p>}
                <div className="flex items-center justify-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border-none cursor-pointer"><Eye size={14} /></button>
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border-none cursor-pointer"><Download size={14} /></button>
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all border-none cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-x-auto hide-scrollbar">
          <div className="min-w-[600px]">
          <div className="grid grid-cols-[1fr_100px_120px_80px_100px] px-5 py-3 border-b border-white/[0.06] text-xs text-white/30 font-medium">
            <span>Nombre</span><span>Tipo</span><span>Modificado</span><span>Tamaño</span><span>Acciones</span>
          </div>
          {filtered.map((file) => {
            const Icon = typeIcons[file.type] || FileText;
            const color = typeColors[file.type] || "#6366f1";
            return (
              <div key={file.id} className="grid grid-cols-[1fr_100px_120px_80px_100px] px-5 py-3 border-b border-white/[0.03] items-center hover:bg-white/[0.02] transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <Icon size={18} style={{ color }} />
                  <span className="text-sm text-white/70 truncate">{file.name}</span>
                </div>
                <span className="text-xs text-white/30 capitalize">{file.type}</span>
                <span className="text-xs text-white/30">{file.modified}</span>
                <span className="text-xs text-white/30">{file.size}</span>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all border-none cursor-pointer bg-transparent"><Eye size={14} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all border-none cursor-pointer bg-transparent"><Download size={14} /></button>
                  <button className="p-1.5 rounded-lg hover:bg-red-500/5 text-white/30 hover:text-red-400 transition-all border-none cursor-pointer bg-transparent"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
