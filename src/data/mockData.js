// ============================
// M.A.R.I.A. Dashboard Mock Data
// ============================

// ---------- TASKS ----------
export const mockTasks = [
  {
    id: "t1",
    title: "Diseñar wireframes del dashboard",
    description: "Crear los wireframes de baja fidelidad para el panel principal",
    status: "done",
    priority: "high",
    dueDate: "2026-05-08",
    tags: ["Diseño", "UI"],
  },
  {
    id: "t2",
    title: "Investigar APIs de Google Calendar",
    description: "Documentar endpoints necesarios para la integración",
    status: "done",
    priority: "high",
    dueDate: "2026-05-07",
    tags: ["Backend", "API"],
  },
  {
    id: "t3",
    title: "Implementar sistema de autenticación",
    description: "Login con Google OAuth y manejo de sesiones",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-05-12",
    tags: ["Backend", "Auth"],
  },
  {
    id: "t4",
    title: "Crear componentes del sidebar",
    description: "Sidebar colapsable con navegación animada",
    status: "in-progress",
    priority: "medium",
    dueDate: "2026-05-13",
    tags: ["Frontend", "UI"],
  },
  {
    id: "t5",
    title: "Configurar base de datos",
    description: "Definir esquemas y conectar con Supabase",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-05-14",
    tags: ["Backend", "DB"],
  },
  {
    id: "t6",
    title: "Escribir documentación del proyecto",
    description: "Documentar la arquitectura y flujos principales",
    status: "todo",
    priority: "low",
    dueDate: "2026-05-18",
    tags: ["Docs"],
  },
  {
    id: "t7",
    title: "Integrar Recharts para gráficas",
    description: "Añadir gráficas de productividad y finanzas",
    status: "todo",
    priority: "medium",
    dueDate: "2026-05-15",
    tags: ["Frontend", "Charts"],
  },
  {
    id: "t8",
    title: "Diseñar página de finanzas",
    description: "Crear mockups para el módulo financiero",
    status: "todo",
    priority: "medium",
    dueDate: "2026-05-16",
    tags: ["Diseño"],
  },
  {
    id: "t9",
    title: "Presentación de avance semestral",
    description: "Preparar slides y demo funcional para la revisión",
    status: "todo",
    priority: "high",
    dueDate: "2026-05-20",
    tags: ["Académico"],
  },
  {
    id: "t10",
    title: "Testing de componentes UI",
    description: "Verificar responsividad y accesibilidad",
    status: "done",
    priority: "medium",
    dueDate: "2026-05-06",
    tags: ["Testing", "QA"],
  },
  {
    id: "t11",
    title: "Optimizar rendimiento del landing",
    description: "Lazy load de imágenes y code splitting",
    status: "done",
    priority: "low",
    dueDate: "2026-05-05",
    tags: ["Performance"],
  },
  {
    id: "t12",
    title: "Crear flujo de n8n para correos",
    description: "Automatizar lectura y resumen de correos con Gemini",
    status: "todo",
    priority: "medium",
    dueDate: "2026-05-17",
    tags: ["Automatización", "n8n"],
  },
];

// ---------- EVENTS ----------
export const mockEvents = [
  {
    id: "e1",
    title: "Reunión de avance - Taller de Investigación",
    start: new Date(2026, 4, 10, 10, 0),
    end: new Date(2026, 4, 10, 11, 30),
    description: "Presentar avances del proyecto M.A.R.I.A.",
    location: "Sala 204, Edificio C",
    color: "#f99e02",
  },
  {
    id: "e2",
    title: "Entrega de reporte técnico",
    start: new Date(2026, 4, 10, 14, 0),
    end: new Date(2026, 4, 10, 14, 30),
    description: "Entregar documentación técnica del sistema",
    location: "Plataforma virtual",
    color: "#ef4444",
  },
  {
    id: "e3",
    title: "Clase de Inteligencia Artificial",
    start: new Date(2026, 4, 10, 17, 0),
    end: new Date(2026, 4, 10, 19, 0),
    description: "Temas: Redes neuronales y NLP",
    location: "Aula 301",
    color: "#3b82f6",
  },
  {
    id: "e4",
    title: "Estudio grupal - Examen final",
    start: new Date(2026, 4, 11, 9, 0),
    end: new Date(2026, 4, 11, 12, 0),
    description: "Repasar temas de bases de datos",
    location: "Biblioteca central",
    color: "#8b5cf6",
  },
  {
    id: "e5",
    title: "Demo del proyecto con asesor",
    start: new Date(2026, 4, 12, 16, 0),
    end: new Date(2026, 4, 12, 17, 0),
    description: "Mostrar prototipo funcional de M.A.R.I.A.",
    location: "Oficina del Dr. García",
    color: "#f99e02",
  },
  {
    id: "e6",
    title: "Hackathon universitario",
    start: new Date(2026, 4, 14, 8, 0),
    end: new Date(2026, 4, 14, 20, 0),
    description: "Competencia de desarrollo de software",
    location: "Auditorio principal",
    color: "#10b981",
  },
  {
    id: "e7",
    title: "Revisión de código con equipo",
    start: new Date(2026, 4, 13, 11, 0),
    end: new Date(2026, 4, 13, 12, 0),
    description: "Code review del módulo de autenticación",
    location: "Google Meet",
    color: "#6366f1",
  },
];

// ---------- EMAILS ----------
export const mockEmails = [
  {
    id: "em1",
    sender: "Dr. Roberto García",
    senderEmail: "rgarcia@universidad.edu",
    subject: "Re: Avance del proyecto M.A.R.I.A.",
    preview: "Hola Juan, me parece excelente el avance que llevas. Solo te pido que para la próxima reunión...",
    date: "2026-05-10T09:15:00",
    read: false,
    starred: true,
  },
  {
    id: "em2",
    sender: "Servicios Escolares",
    senderEmail: "escolares@universidad.edu",
    subject: "Recordatorio: Inscripción a materias",
    preview: "Se le recuerda que el período de inscripción para el próximo semestre inicia el 15 de mayo...",
    date: "2026-05-10T08:30:00",
    read: false,
    starred: false,
  },
  {
    id: "em3",
    sender: "GitHub",
    senderEmail: "noreply@github.com",
    subject: "[maria-web] Pull Request #42 merged",
    preview: "The pull request 'feat: dashboard layout' has been successfully merged into main...",
    date: "2026-05-09T22:45:00",
    read: true,
    starred: false,
  },
  {
    id: "em4",
    sender: "Ana Martínez",
    senderEmail: "ana.mtz@gmail.com",
    subject: "Notas del estudio grupal",
    preview: "Hey! Te comparto las notas que tomé durante la sesión de estudio. El tema de normalización...",
    date: "2026-05-09T18:20:00",
    read: true,
    starred: true,
  },
  {
    id: "em5",
    sender: "Google Cloud",
    senderEmail: "cloud-noreply@google.com",
    subject: "Tu crédito de Google Cloud está por vencer",
    preview: "Tu crédito gratuito de $300 USD vence en 15 días. Aprovecha para explorar nuestros servicios...",
    date: "2026-05-09T14:00:00",
    read: true,
    starred: false,
  },
  {
    id: "em6",
    sender: "Carlos López",
    senderEmail: "carlos.lopez@empresa.com",
    subject: "Oportunidad de prácticas profesionales",
    preview: "Hola Juan, vi tu perfil en LinkedIn y me gustaría platicarte sobre una oportunidad...",
    date: "2026-05-08T11:30:00",
    read: false,
    starred: true,
  },
  {
    id: "em7",
    sender: "Notion",
    senderEmail: "team@notion.so",
    subject: "What's new in Notion — May 2026",
    preview: "Discover the latest features including AI-powered summaries, improved databases...",
    date: "2026-05-08T09:00:00",
    read: true,
    starred: false,
  },
];

// ---------- FILES ----------
export const mockFiles = [
  {
    id: "f1",
    name: "Reporte_Avance_MARIA.pdf",
    type: "pdf",
    size: "2.4 MB",
    modified: "2026-05-10",
    shared: true,
  },
  {
    id: "f2",
    name: "Tesis_Cap3_Draft.docx",
    type: "doc",
    size: "1.8 MB",
    modified: "2026-05-09",
    shared: false,
  },
  {
    id: "f3",
    name: "Diagrama_Arquitectura.png",
    type: "image",
    size: "890 KB",
    modified: "2026-05-08",
    shared: true,
  },
  {
    id: "f4",
    name: "Apuntes_IA_Semana12.pdf",
    type: "pdf",
    size: "1.2 MB",
    modified: "2026-05-07",
    shared: false,
  },
  {
    id: "f5",
    name: "Presupuesto_Proyecto.xlsx",
    type: "spreadsheet",
    size: "340 KB",
    modified: "2026-05-06",
    shared: true,
  },
  {
    id: "f6",
    name: "Presentacion_Demo.pptx",
    type: "presentation",
    size: "5.1 MB",
    modified: "2026-05-05",
    shared: false,
  },
  {
    id: "f7",
    name: "Video_Demo_v2.mp4",
    type: "video",
    size: "48.2 MB",
    modified: "2026-05-04",
    shared: false,
  },
  {
    id: "f8",
    name: "README.md",
    type: "doc",
    size: "4 KB",
    modified: "2026-05-03",
    shared: true,
  },
];

// ---------- FINANCES ----------
export const mockTransactions = [
  { id: "tr1", type: "expense", amount: 250, category: "Comida", date: "2026-05-10", description: "Despensa semanal" },
  { id: "tr2", type: "income", amount: 5000, category: "Freelance", date: "2026-05-09", description: "Proyecto web cliente" },
  { id: "tr3", type: "expense", amount: 150, category: "Transporte", date: "2026-05-09", description: "Gasolina" },
  { id: "tr4", type: "expense", amount: 800, category: "Escuela", date: "2026-05-08", description: "Libros del semestre" },
  { id: "tr5", type: "income", amount: 3000, category: "Beca", date: "2026-05-07", description: "Beca académica mayo" },
  { id: "tr6", type: "expense", amount: 200, category: "Entretenimiento", date: "2026-05-06", description: "Cine y comida" },
  { id: "tr7", type: "expense", amount: 1500, category: "Tecnología", date: "2026-05-05", description: "Mouse y teclado" },
  { id: "tr8", type: "income", amount: 2000, category: "Freelance", date: "2026-05-04", description: "Mantenimiento sitio web" },
  { id: "tr9", type: "expense", amount: 350, category: "Comida", date: "2026-05-03", description: "Restaurante con amigos" },
  { id: "tr10", type: "expense", amount: 120, category: "Transporte", date: "2026-05-02", description: "Uber semana" },
];

export const mockFinancialGoals = [
  { id: "g1", name: "Laptop nueva", current: 8000, target: 20000, color: "#f99e02" },
  { id: "g2", name: "Fondo de emergencia", current: 12000, target: 15000, color: "#10b981" },
  { id: "g3", name: "Viaje de graduación", current: 3500, target: 25000, color: "#6366f1" },
];

export const mockMonthlyFinances = [
  { month: "Ene", ingresos: 8000, gastos: 5200 },
  { month: "Feb", ingresos: 9500, gastos: 6100 },
  { month: "Mar", ingresos: 7800, gastos: 5800 },
  { month: "Abr", ingresos: 10200, gastos: 7300 },
  { month: "May", ingresos: 10000, gastos: 3370 },
];

export const mockExpensesByCategory = [
  { name: "Comida", value: 600, color: "#f99e02" },
  { name: "Transporte", value: 270, color: "#3b82f6" },
  { name: "Escuela", value: 800, color: "#8b5cf6" },
  { name: "Entretenimiento", value: 200, color: "#ef4444" },
  { name: "Tecnología", value: 1500, color: "#10b981" },
];

// ---------- PRODUCTIVITY ----------
export const mockWeeklyProductivity = [
  { day: "Lun", tareas: 5, horas: 6.5 },
  { day: "Mar", tareas: 3, horas: 4.0 },
  { day: "Mie", tareas: 7, horas: 8.2 },
  { day: "Jue", tareas: 4, horas: 5.5 },
  { day: "Vie", tareas: 6, horas: 7.0 },
  { day: "Sab", tareas: 2, horas: 3.0 },
  { day: "Dom", tareas: 1, horas: 1.5 },
];

export const mockTaskDistribution = [
  { name: "Frontend", value: 35, color: "#f99e02" },
  { name: "Backend", value: 25, color: "#3b82f6" },
  { name: "Diseño", value: 15, color: "#8b5cf6" },
  { name: "Docs", value: 10, color: "#10b981" },
  { name: "Testing", value: 15, color: "#ef4444" },
];

export const mockMonthlyActivity = [
  { week: "Sem 1", completadas: 12, creadas: 15 },
  { week: "Sem 2", completadas: 18, creadas: 14 },
  { week: "Sem 3", completadas: 8, creadas: 11 },
  { week: "Sem 4", completadas: 22, creadas: 19 },
];

// Heatmap data (simulated 90 days)
export const mockHeatmapData = Array.from({ length: 365 }, (_, i) => {
  const date = new Date(2026, 0, 1);
  date.setDate(date.getDate() + i);
  return {
    date: date.toISOString().split("T")[0],
    count: Math.floor(Math.random() * 8),
  };
});

export const mockProductivityMetrics = {
  hoursToday: 5.5,
  tasksCompleted: 28,
  dailyAverage: 4.2,
  streak: 12,
};

// ---------- NOTIFICATIONS ----------
export const mockNotifications = [
  {
    id: "n1",
    type: "task",
    title: "Tarea próxima a vencer",
    message: "\"Presentación de avance semestral\" vence el 20 de mayo",
    time: "hace 2 horas",
    read: false,
  },
  {
    id: "n2",
    type: "event",
    title: "Evento en 30 minutos",
    message: "Reunión de avance - Taller de Investigación a las 10:00 AM",
    time: "hace 30 min",
    read: false,
  },
  {
    id: "n3",
    type: "reminder",
    title: "Recordatorio",
    message: "No olvides subir el reporte técnico hoy antes de las 2 PM",
    time: "hace 1 hora",
    read: false,
  },
  {
    id: "n4",
    type: "task",
    title: "Tarea completada",
    message: "\"Testing de componentes UI\" fue marcada como completada",
    time: "ayer",
    read: true,
  },
  {
    id: "n5",
    type: "event",
    title: "Evento mañana",
    message: "Estudio grupal - Examen final mañana a las 9:00 AM",
    time: "ayer",
    read: true,
  },
];

// ---------- USER ----------
export const mockUser = {
  name: "Juan Rivera",
  email: "juan.rivera@universidad.edu",
  avatar: null,
  initials: "JR",
};
