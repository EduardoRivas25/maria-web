import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Clock, AlertCircle, CheckCircle2, 
  FileText, X, Play, Pause, RotateCcw, BrainCircuit, Timer,
  Check, Edit2, Users, Loader2
} from "lucide-react";
import { classroomApi } from "@/lib/api/classroom";
import { isGoogleConnected } from "@/lib/google-auth";
import GoogleConnectPrompt from "@/components/GoogleConnectPrompt";

// Helper for today
const todayStr = new Date().toISOString().split('T')[0];

const classColors = [
  { color: "from-blue-500/20 to-blue-900/10", border: "border-blue-500/30", icon: Users },
  { color: "from-[#f99e02]/20 to-[#f99e02]/5", border: "border-[#f99e02]/30", icon: FileText },
  { color: "from-emerald-500/20 to-emerald-900/10", border: "border-emerald-500/30", icon: BookOpen },
  { color: "from-purple-500/20 to-purple-900/10", border: "border-purple-500/30", icon: Users },
  { color: "from-pink-500/20 to-pink-900/10", border: "border-pink-500/30", icon: BookOpen },
];

export default function ClassroomPage() {
  const [tasks, setTasks] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([
    { id: "all", name: "Todas las Clases", teacher: "", color: "from-white/10 to-white/5", border: "border-white/10", icon: BookOpen }
  ]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeClassFilter, setActiveClassFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all"); // 'all' | 'today'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsGoogle, setNeedsGoogle] = useState(!isGoogleConnected());
  
  // Pomodoro Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('focus'); // focus, break
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [inputTime, setInputTime] = useState("25:00");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch courses
      const coursesRes = await classroomApi.getCourses();
      const mappedCourses = coursesRes.map((c, i) => {
        const style = classColors[i % classColors.length];
        return {
          id: c.id,
          name: c.name,
          teacher: c.section || '',
          color: style.color,
          border: style.border,
          icon: style.icon
        };
      });

      setEnrolledClasses([
        { id: "all", name: "Todas las Clases", teacher: "", color: "from-white/10 to-white/5", border: "border-white/10", icon: BookOpen },
        ...mappedCourses
      ]);

      // 2. Fetch all coursework
      const allWork = await classroomApi.getAllCoursework();
      
      const mappedTasks = allWork.map(w => {
        let dueDate = null;
        if (w.dueDate) {
          dueDate = new Date(w.dueDate.year, w.dueDate.month - 1, w.dueDate.day).toISOString().split('T')[0];
        }

        return {
          id: w.id,
          classId: w.courseId,
          title: w.title,
          course: w.courseName,
          dueDate,
          status: 'pending', // Would need submissions API to check true status
          description: w.description || 'Sin descripción',
          estimatedTime: '1 hora', // Mocked estimation
          progress: 0,
          alternateLink: w.alternateLink
        };
      });

      setTasks(mappedTasks);
    } catch (err) {
      console.error("[Classroom] Load error:", err);
      if (err.message === 'NO_GOOGLE_TOKEN') {
        setNeedsGoogle(true);
      } else {
        setError('Error al cargar datos de Google Classroom: ' + (err.message || JSON.stringify(err)));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!needsGoogle) fetchData();
  }, [fetchData, needsGoogle]);

  const playAlarm = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const playNote = (frequency, startTime, duration) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, startTime);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        const now = audioCtx.currentTime;
        playNote(1046.50, now, 0.6); // C6
        playNote(1318.51, now, 0.6); // E6
        playNote(1318.51, now + 0.15, 1.0); // E6
        playNote(1567.98, now + 0.15, 1.0); // G6
    } catch (e) {
        console.log("Web Audio API not supported", e);
    }
  };

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playAlarm();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const toggleTimer = () => {
    if (isEditingTime) handleSaveTime();
    setIsTimerRunning(!isTimerRunning);
  };
  
  const resetTimer = () => {
    setIsTimerRunning(false);
    setIsEditingTime(false);
    setTimeLeft(timerMode === 'focus' ? 25 * 60 : 5 * 60);
    setInputTime(timerMode === 'focus' ? "25:00" : "05:00");
  };

  const switchTimerMode = (mode) => {
    setIsTimerRunning(false);
    setIsEditingTime(false);
    setTimerMode(mode);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
    setInputTime(mode === 'focus' ? "25:00" : "05:00");
  };

  const handleSaveTime = () => {
    let totalSeconds = 0;
    if (inputTime.includes(':')) {
        const parts = inputTime.split(':');
        totalSeconds = parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
    } else {
        const val = parseFloat(inputTime);
        if (val < 60 && !inputTime.includes('.')) {
            totalSeconds = val * 60;
        } else {
            totalSeconds = val * 60;
        }
    }

    if (!isNaN(totalSeconds) && totalSeconds > 0) {
      setTimeLeft(Math.floor(totalSeconds));
      setInputTime(formatTime(Math.floor(totalSeconds)));
    } else {
      setInputTime(formatTime(timeLeft));
    }
    setIsEditingTime(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTaskStatus = (taskId) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          status: t.status === 'completed' ? 'pending' : 'completed',
          progress: t.status === 'completed' ? 0 : 100
        };
      }
      return t;
    }));
    if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => ({
            ...prev,
            status: prev.status === 'completed' ? 'pending' : 'completed',
            progress: prev.status === 'completed' ? 0 : 100
        }));
    }
  };

  const handleEditClick = () => {
      setIsEditingTime(true);
      setInputTime(formatTime(timeLeft));
  };

  const filteredTasks = tasks.filter(t => {
      const matchClass = activeClassFilter === "all" || t.classId === activeClassFilter;
      const matchTime = timeFilter === "all" || (timeFilter === "today" && t.dueDate === todayStr);
      return matchClass && matchTime;
  });

  if (needsGoogle) {
    return (
      <div className="max-w-[1400px] py-20">
        <GoogleConnectPrompt
          serviceName="Google Classroom"
          onConnected={() => { setNeedsGoogle(false); setLoading(true); fetchData(); }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1400px]">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle size={32} className="text-red-400 mb-3" />
          <p className="text-red-400 font-medium mb-1">No se pudo conectar a Google Classroom</p>
          <p className="text-sm text-red-400/70">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="text-[#f99e02] animate-spin mb-4" />
        <p className="text-white/40 text-sm">Cargando clases y tareas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] space-y-6 pb-12 relative">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BookOpen className="text-[#f99e02]" size={32} />
          Google Classroom
        </h1>
        <p className="text-white/50 text-sm">Gestiona tus clases inscritas, tareas y sesiones de estudio.</p>
      </div>

      {/* Clases Inscritas */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={18} className="text-[#f99e02]" />
            Mis Clases
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {enrolledClasses.map((cls) => {
                const Icon = cls.icon || BookOpen;
                const isActive = activeClassFilter === cls.id;
                return (
                    <motion.div
                        key={cls.id}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveClassFilter(cls.id)}
                        className={`cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 relative
                            ${isActive ? `border-white/40 ring-2 ring-[#f99e02]/50 shadow-lg shadow-[#f99e02]/10` : cls.border}
                            bg-gradient-to-br ${cls.color}
                        `}
                    >
                        {isActive && (
                            <div className="absolute top-2 right-2 bg-[#f99e02] text-black rounded-full p-1 shadow-md">
                                <Check size={12} className="stroke-[3]" />
                            </div>
                        )}
                        <div className="p-5 h-full flex flex-col justify-between bg-black/40 backdrop-blur-sm hover:bg-black/20 transition-colors">
                            <div>
                                <Icon size={24} className="text-white/70 mb-3" />
                                <h3 className="text-white font-bold text-lg leading-tight mb-1 truncate" title={cls.name}>{cls.name}</h3>
                                {cls.teacher && <p className="text-white/50 text-xs truncate" title={cls.teacher}>{cls.teacher}</p>}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Tareas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="xl:col-span-2 space-y-6"
        >
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="text-[#f99e02]" size={20} />
                {activeClassFilter === "all" ? "Todas las Tareas" : "Tareas de la Clase"}
              </h2>

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
                <button 
                    onClick={() => setTimeFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border-none cursor-pointer ${timeFilter === 'all' ? 'bg-[#f99e02]/20 text-[#f99e02]' : 'bg-transparent text-white/50 hover:text-white/80'}`}
                >
                    Todas
                </button>
                <button 
                    onClick={() => setTimeFilter('today')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors border-none cursor-pointer ${timeFilter === 'today' ? 'bg-[#f99e02]/20 text-[#f99e02]' : 'bg-transparent text-white/50 hover:text-white/80'}`}
                >
                    Para Hoy
                </button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredTasks.length === 0 ? (
                 <div className="py-12 text-center text-white/30 border border-white/5 border-dashed rounded-xl">
                    <CheckCircle2 size={32} className="mx-auto mb-3 opacity-20" />
                    <p>No hay tareas para estos filtros.</p>
                 </div>
              ) : (
                filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                    onClick={() => setSelectedTask(task)}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-[#f99e02]/30 transition-all duration-300 cursor-pointer relative overflow-hidden"
                  >
                    {task.status !== 'completed' && task.progress > 0 && (
                      <div 
                          className="absolute left-0 bottom-0 h-1 bg-[#f99e02]/30 transition-all duration-500" 
                          style={{ width: `${task.progress}%` }} 
                      />
                    )}

                    <div className={`mt-1 sm:mt-0 p-3 rounded-xl flex-shrink-0 transition-colors ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#f99e02]/10 text-[#f99e02]'}`}>
                      {task.status === 'completed' ? <Check size={20} /> : <FileText size={20} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm md:text-base font-semibold truncate transition-colors ${task.status === 'completed' ? 'text-white/40 line-through' : 'text-white/90 group-hover:text-white'}`} title={task.title}>
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/5 text-white/50 truncate max-w-[150px]">
                              {task.course}
                          </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/60 ${task.dueDate === todayStr ? 'bg-[#f99e02]/20 text-[#f99e02]' : task.dueDate ? 'bg-black/20' : 'bg-transparent'}`}>
                          {task.dueDate && (
                            <>
                              <Clock size={14} />
                              <span className="text-xs font-medium">
                                  {task.dueDate === todayStr ? 'Hoy' : new Date(task.dueDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                              </span>
                            </>
                          )}
                          {!task.dueDate && <span className="text-xs text-white/30">Sin fecha</span>}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column: Pomodoro */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-gradient-to-br from-[#1a1305] to-[#0a0a0b] border border-[#f99e02]/20 rounded-2xl p-6 relative overflow-hidden sticky top-6"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#f99e02]/10 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center gap-2 mb-6">
              <BrainCircuit className="text-[#f99e02]" size={20} />
              <h2 className="text-lg font-semibold text-white">Sesión de Enfoque</h2>
            </div>

            <div className="flex bg-black/40 rounded-lg p-1 mb-6">
                <button 
                    onClick={() => switchTimerMode('focus')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${timerMode === 'focus' ? 'bg-[#f99e02]/20 text-[#f99e02]' : 'text-white/40 hover:text-white/80'} border-none cursor-pointer`}
                >
                    Pomodoro
                </button>
                <button 
                    onClick={() => switchTimerMode('break')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${timerMode === 'break' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/40 hover:text-white/80'} border-none cursor-pointer`}
                >
                    Descanso
                </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 relative group min-h-[120px]">
              {isEditingTime ? (
                <input 
                  type="text" 
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  onBlur={handleSaveTime}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTime()}
                  autoFocus
                  className="w-48 bg-transparent border-b-2 border-[#f99e02] outline-none text-center text-[#f99e02] text-6xl font-black font-mono tracking-wider tabular-nums placeholder-[#f99e02]/30"
                  placeholder="00:30"
                />
              ) : (
                <div 
                  onClick={() => !isTimerRunning && handleEditClick()}
                  className={`cursor-pointer text-6xl font-black font-mono tracking-wider tabular-nums transition-colors ${timerMode === 'focus' ? 'text-[#f99e02]' : 'text-emerald-400'}`}
                >
                  {formatTime(timeLeft)}
                </div>
              )}
              
              {!isTimerRunning && !isEditingTime && (
                 <button 
                   onClick={handleEditClick}
                   className="absolute top-0 right-4 md:right-10 p-2 text-white/50 hover:text-white transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 bg-white/10 md:bg-white/5 rounded-full border-none cursor-pointer"
                   title="Editar Tiempo (ej. 0:30, 25:00)"
                 >
                   <Edit2 size={16} />
                 </button>
              )}

              <p className="text-white/30 text-xs mt-6 uppercase tracking-widest font-medium text-center">
                  {timerMode === 'focus' ? 'Tiempo de trabajo' : 'Tiempo de relajación'}
                  <br/>
                  <span className="text-[10px] opacity-60 normal-case tracking-normal">(Edita con formato mm:ss, ej: 0:30)</span>
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-6">
              <button 
                onClick={toggleTimer}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${isTimerRunning ? 'bg-white/10 text-white' : 'bg-[#f99e02] text-white shadow-[0_0_20px_rgba(249,158,2,0.3)] border-none cursor-pointer'}`}
              >
                {isTimerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
              <button 
                onClick={resetTimer}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors border-none cursor-pointer"
                title="Reiniciar"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedTask(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-start bg-white/[0.02]">
                <div className="pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#f99e02] bg-[#f99e02]/10 px-2 py-1 rounded-md">
                        {selectedTask.course}
                    </span>
                    {selectedTask.status === 'completed' && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                            <Check size={12} /> Completada
                        </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white leading-tight">
                    {selectedTask.title}
                  </h2>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border-none cursor-pointer flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                <div>
                    <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Descripción</h4>
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                        {selectedTask.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <Clock className="text-[#f99e02] mb-2" size={20} />
                        <span className="text-xs text-white/40 mb-1">Fecha de Entrega</span>
                        <span className="text-sm font-semibold text-white/90">
                            {selectedTask.dueDate === todayStr ? 'Hoy' : selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString("es-MX", { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sin fecha límite'}
                        </span>
                    </div>
                    {selectedTask.alternateLink && (
                      <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => window.open(selectedTask.alternateLink, '_blank')}>
                          <BookOpen className="text-[#f99e02] mb-2" size={20} />
                          <span className="text-xs text-white/40 mb-1">Ver en Classroom</span>
                          <span className="text-sm font-semibold text-white/90">
                              Abrir enlace
                          </span>
                      </div>
                    )}
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row gap-3">
                <button 
                    onClick={() => toggleTaskStatus(selectedTask.id)}
                    className={`w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer border-none ${
                        selectedTask.status === 'completed' 
                        ? 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10' 
                        : 'bg-[#f99e02] text-white hover:bg-[#e08e02] border border-transparent'
                    }`}
                >
                    {selectedTask.status === 'completed' ? (
                        <>Reabrir Tarea</>
                    ) : (
                        <><CheckCircle2 size={18} /> Marcar Completada</>
                    )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
