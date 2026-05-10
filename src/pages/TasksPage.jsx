import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X, GripVertical, Clock, Search } from "lucide-react";
import { mockTasks } from "@/data/mockData";

const columns = [
  { id: "todo", title: "📝 Pendiente", color: "#f99e02" },
  { id: "in-progress", title: "⚡ En Progreso", color: "#3b82f6" },
  { id: "done", title: "✅ Finalizado", color: "#10b981" },
];
const priorityConfig = {
  high: { label: "Alta", bg: "bg-red-500/10 text-red-400" },
  medium: { label: "Media", bg: "bg-[#f99e02]/10 text-[#f99e02]" },
  low: { label: "Baja", bg: "bg-emerald-500/10 text-emerald-400" },
};

function TaskCard({ task, isDragging }) {
  const p = priorityConfig[task.priority];
  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing ${isDragging ? "bg-[#1a1a1b] border-[#f99e02]/30 shadow-[0_0_30px_rgba(249,158,2,0.15)] scale-105" : "bg-white/[0.03] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05]"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-white/90 leading-snug">{task.title}</h4>
        <GripVertical size={14} className="text-white/20 flex-shrink-0 mt-0.5" />
      </div>
      {task.description && <p className="text-xs text-white/35 mb-3 line-clamp-2">{task.description}</p>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${p.bg}`}>{p.label}</span>
          {task.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-md">{tag}</span>
          ))}
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1 text-white/25">
            <Clock size={11} />
            <span className="text-[10px]">{new Date(task.dueDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { task } });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={false} />
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState(mockTasks);
  const [activeTask, setActiveTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", dueDate: "", tags: "" });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filteredTasks = tasks.filter((t) => {
    if (filter === "today") return t.dueDate === new Date().toISOString().split("T")[0];
    if (filter === "urgent") return t.priority === "high";
    if (filter === "done") return t.status === "done";
    return true;
  }).filter((t) => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  function handleDragStart(e) { setActiveTask(tasks.find((t) => t.id === e.active.id)); }
  function handleDragEnd(e) {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;
    const overCol = columns.find((c) => c.id === over.id);
    const overTask = tasks.find((t) => t.id === over.id);
    const targetStatus = overCol ? overCol.id : overTask?.status;
    if (targetStatus) setTasks((prev) => prev.map((t) => t.id === active.id ? { ...t, status: targetStatus } : t));
  }
  function handleCreateTask(ev) {
    ev.preventDefault();
    setTasks([{ id: `t${Date.now()}`, title: newTask.title, description: newTask.description, priority: newTask.priority, dueDate: newTask.dueDate, status: "todo", tags: newTask.tags ? newTask.tags.split(",").map((s) => s.trim()) : [] }, ...tasks]);
    setNewTask({ title: "", description: "", priority: "medium", dueDate: "", tags: "" });
    setShowModal(false);
  }

  return (
    <div className="max-w-[1400px]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2 w-64">
            <Search size={14} className="text-white/30" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar tareas..." className="bg-transparent border-none outline-none text-sm text-white placeholder-white/30 flex-1" />
          </div>
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            {[{ id: "all", label: "Todas" }, { id: "today", label: "Hoy" }, { id: "urgent", label: "Urgentes" }, { id: "done", label: "Finalizadas" }].map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border-none cursor-pointer ${filter === f.id ? "bg-[#f99e02]/15 text-[#f99e02]" : "text-white/40 hover:text-white/70 bg-transparent"}`}>{f.label}</button>
            ))}
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f99e02] hover:bg-[#e08e02] text-white text-sm font-semibold border-none cursor-pointer transition-colors shadow-[0_0_20px_rgba(249,158,2,0.2)]">
          <Plus size={16} /> Nueva Tarea
        </motion.button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <SortableContext key={col.id} items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy} id={col.id}>
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 min-h-[400px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white/80">{col.title}</h3>
                      <span className="text-[11px] font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                    </div>
                    <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  </div>
                  <div className="space-y-3">
                    {colTasks.map((task) => <SortableTaskCard key={task.id} task={task} />)}
                    {colTasks.length === 0 && <div className="flex items-center justify-center py-12 text-white/15 text-xs">Sin tareas</div>}
                  </div>
                </div>
              </SortableContext>
            );
          })}
        </div>
        <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragging /> : null}</DragOverlay>
      </DndContext>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <motion.form initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} onSubmit={handleCreateTask} className="w-full max-w-md bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Nueva Tarea</h2>
                <button type="button" onClick={() => setShowModal(false)} className="text-white/30 hover:text-white/60 bg-transparent border-none cursor-pointer"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Título</label>
                  <input type="text" required value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="¿Qué necesitas hacer?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f99e02]/50 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Descripción</label>
                  <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Describe la tarea..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f99e02]/50 transition-colors resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 font-medium block mb-1.5">Prioridad</label>
                    <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#f99e02]/50 transition-colors cursor-pointer">
                      <option value="high" className="bg-[#141414]">🔴 Alta</option>
                      <option value="medium" className="bg-[#141414]">🟡 Media</option>
                      <option value="low" className="bg-[#141414]">🟢 Baja</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 font-medium block mb-1.5">Fecha límite</label>
                    <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#f99e02]/50 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium block mb-1.5">Etiquetas</label>
                  <input type="text" value={newTask.tags} onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })} placeholder="Frontend, UI (comas)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f99e02]/50 transition-colors" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm font-medium hover:bg-white/5 transition-colors bg-transparent cursor-pointer">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#f99e02] hover:bg-[#e08e02] text-white text-sm font-semibold border-none cursor-pointer transition-colors">Crear Tarea</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
