import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FolderOpen, FileText, Image, FileSpreadsheet, Film, Presentation, Grid3X3, List, Download, Trash2, Eye, Search, Loader2, AlertCircle } from "lucide-react";
import { driveApi } from "@/lib/api/drive";
import { isGoogleConnected } from "@/lib/google-auth";
import GoogleConnectPrompt from "@/components/GoogleConnectPrompt";

const typeIcons = { 
  'application/pdf': FileText, 
  'application/vnd.google-apps.document': FileText, 
  'image/jpeg': Image,
  'image/png': Image, 
  'application/vnd.google-apps.spreadsheet': FileSpreadsheet, 
  'video/mp4': Film, 
  'application/vnd.google-apps.presentation': Presentation,
  'application/vnd.google-apps.folder': FolderOpen
};

const typeColors = { 
  'application/pdf': "#ef4444", 
  'application/vnd.google-apps.document': "#3b82f6", 
  'image/jpeg': "#10b981",
  'image/png': "#10b981", 
  'application/vnd.google-apps.spreadsheet': "#f99e02", 
  'video/mp4': "#8b5cf6", 
  'application/vnd.google-apps.presentation': "#ec4899",
  'application/vnd.google-apps.folder': "#a8a29e"
};

const formatSize = (bytes) => {
  if (!bytes) return '--';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function FilesPage() {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [needsGoogle, setNeedsGoogle] = useState(!isGoogleConnected());
  const [folderPath, setFolderPath] = useState([{ id: 'root', name: 'Mi Drive' }]);

  const currentFolderId = folderPath[folderPath.length - 1].id;

  const fetchFiles = useCallback(async (query = "", folderId = "root") => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (query.trim()) {
        result = await driveApi.search(query);
      } else {
        result = await driveApi.listFiles({ pageSize: 50, folderId });
      }
      setFiles(result.files || []);
    } catch (err) {
      console.error("[Drive] Load error:", err);
      if (err.message === 'NO_GOOGLE_TOKEN') {
        setNeedsGoogle(true);
      } else {
        setError('Error al cargar los archivos de Google Drive.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (needsGoogle) return;
    const timer = setTimeout(() => {
      fetchFiles(searchQuery, currentFolderId);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, currentFolderId, fetchFiles, needsGoogle]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar este archivo?")) return;
    setDeletingId(id);
    try {
      await driveApi.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Error al eliminar el archivo");
    } finally {
      setDeletingId(null);
    }
  };

  const handleItemClick = (e, file) => {
    e.stopPropagation();
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      setFolderPath(prev => [...prev, { id: file.id, name: file.name }]);
      setSearchQuery('');
    } else if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  const handleOpen = (e, url) => {
    e.stopPropagation();
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 w-full sm:w-72">
            <Search size={14} className="text-white/30" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar en Drive..." className="bg-transparent border-none outline-none text-sm text-white placeholder-white/30 flex-1" />
          </div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-white/30 overflow-x-auto hide-scrollbar max-w-full">
            {folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-1 flex-shrink-0">
                {index > 0 && <span>/</span>}
                <button 
                  onClick={() => setFolderPath(prev => prev.slice(0, index + 1))}
                  className={`hover:text-[#f99e02] transition-colors border-none bg-transparent cursor-pointer p-0 ${index === folderPath.length - 1 ? 'text-[#f99e02]' : ''}`}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 self-start sm:self-auto">
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all border-none cursor-pointer ${viewMode === "grid" ? "bg-[#f99e02]/15 text-[#f99e02]" : "text-white/40 hover:text-white/70 bg-transparent"}`}><Grid3X3 size={14} /></button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all border-none cursor-pointer ${viewMode === "list" ? "bg-[#f99e02]/15 text-[#f99e02]" : "text-white/40 hover:text-white/70 bg-transparent"}`}><List size={14} /></button>
        </div>
      </div>

      {needsGoogle ? (
        <div className="py-10">
          <GoogleConnectPrompt
            serviceName="Google Drive"
            onConnected={() => { setNeedsGoogle(false); setLoading(true); fetchFiles(); }}
          />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle size={32} className="text-red-400 mb-3" />
          <p className="text-red-400 font-medium mb-1">No se pudo conectar a Google Drive</p>
          <p className="text-sm text-red-400/70">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="text-[#f99e02] animate-spin mb-4" />
          <p className="text-white/40 text-sm">Cargando archivos...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
          <FolderOpen size={40} className="text-white/10 mb-3" />
          <p className="text-sm text-white/30">No se encontraron archivos</p>
        </div>
      ) : viewMode === "grid" ? (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => {
            const Icon = typeIcons[file.mimeType] || FileText;
            const color = typeColors[file.mimeType] || "#6366f1";
            const isDeleting = deletingId === file.id;
            return (
              <motion.div key={file.id} variants={item} onClick={(e) => handleItemClick(e, file)} className={`bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 hover:shadow-[0_0_30px_rgba(249,158,2,0.04)] transition-all duration-300 cursor-pointer group relative overflow-hidden ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-center w-14 h-14 rounded-xl mx-auto mb-4" style={{ background: `${color}12` }}>
                  <Icon size={28} style={{ color }} />
                </div>
                <h4 className="text-sm font-medium text-white/80 text-center truncate group-hover:text-white transition-colors px-2" title={file.name}>{file.name}</h4>
                <p className="text-xs text-white/30 text-center mt-1">{formatSize(file.size)} · {formatDate(file.modifiedTime)}</p>
                <div className="flex items-center justify-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {file.mimeType !== 'application/vnd.google-apps.folder' && (
                    <>
                      <button onClick={(e) => handleOpen(e, file.webViewLink)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border-none cursor-pointer"><Eye size={14} /></button>
                      <button onClick={(e) => handleOpen(e, file.webContentLink)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border-none cursor-pointer"><Download size={14} /></button>
                    </>
                  )}
                  <button onClick={(e) => handleDelete(e, file.id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all border-none cursor-pointer"><Trash2 size={14} /></button>
                </div>
                {isDeleting && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10">
                    <Loader2 size={24} className="text-red-400 animate-spin" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl overflow-x-auto hide-scrollbar relative">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[1fr_100px_120px_80px_100px] px-5 py-3 border-b border-white/[0.06] text-xs text-white/30 font-medium">
              <span>Nombre</span><span>Tipo</span><span>Modificado</span><span>Tamaño</span><span>Acciones</span>
            </div>
            {files.map((file) => {
              const Icon = typeIcons[file.mimeType] || FileText;
              const color = typeColors[file.mimeType] || "#6366f1";
              const isDeleting = deletingId === file.id;
              const typeLabel = file.mimeType.split('.').pop().split('/').pop();
              
              return (
                <div key={file.id} onClick={(e) => handleItemClick(e, file)} className={`grid grid-cols-[1fr_100px_120px_80px_100px] px-5 py-3 border-b border-white/[0.03] items-center hover:bg-white/[0.02] transition-colors cursor-pointer relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <Icon size={18} style={{ color }} className="flex-shrink-0" />
                    <span className="text-sm text-white/70 truncate" title={file.name}>{file.name}</span>
                  </div>
                  <span className="text-xs text-white/30 capitalize truncate" title={typeLabel}>{typeLabel}</span>
                  <span className="text-xs text-white/30">{formatDate(file.modifiedTime)}</span>
                  <span className="text-xs text-white/30">{formatSize(file.size)}</span>
                  <div className="flex items-center gap-1 relative z-10">
                    {file.mimeType !== 'application/vnd.google-apps.folder' && (
                      <>
                        <button onClick={(e) => handleOpen(e, file.webViewLink)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all border-none cursor-pointer bg-transparent"><Eye size={14} /></button>
                        <button onClick={(e) => handleOpen(e, file.webContentLink)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white transition-all border-none cursor-pointer bg-transparent"><Download size={14} /></button>
                      </>
                    )}
                    <button onClick={(e) => handleDelete(e, file.id)} className="p-1.5 rounded-lg hover:bg-red-500/5 text-white/30 hover:text-red-400 transition-all border-none cursor-pointer bg-transparent"><Trash2 size={14} /></button>
                  </div>
                  {isDeleting && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-end pr-8 backdrop-blur-[1px]">
                      <Loader2 size={18} className="text-red-400 animate-spin" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
