// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Smart Notifications Hook (v2 — Progressive)
// Loads each source IN PARALLEL and renders results as they
// arrive, so the user sees notifications within ~200ms (tasks)
// instead of waiting 5-10s for all Google APIs.
//
// Sources:
//   1. Tareas que vencen hoy / atrasadas (DB — fastest)
//   2. Eventos de calendario mañana (Google Calendar)
//   3. Correos nuevos no leídos (Gmail — with sound)
//   4. Tareas de Classroom próximas (Google Classroom — slowest)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { isGoogleConnected } from '../google-auth';
import { tasksApi } from '../api/tasks';
import { calendarApi } from '../api/calendar';
import { gmailApi } from '../api/gmail';
import { classroomApi } from '../api/classroom';

// ── Constants ───────────────────────────────────────────────
const POLL_INTERVAL = 3 * 60 * 1000; // 3 minutes
const SEEN_KEY = 'maria_notifs_seen';
const LAST_EMAIL_KEY = 'maria_last_email_ids';
const CACHE_KEY = 'maria_notifs_cache';

// ── Notification Sound (Web Audio API) ──────────────────────
let audioCtx = null;

function playNotificationSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const now = audioCtx.currentTime;

    // Pleasant three-tone chime
    const tones = [
      { freq: 880,     start: now,        end: now + 0.3,  vol: 0.15 }, // A5
      { freq: 1174.66, start: now + 0.15, end: now + 0.5,  vol: 0.12 }, // D6
      { freq: 1318.51, start: now + 0.3,  end: now + 0.7,  vol: 0.10 }, // E6
    ];

    for (const t of tones) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(t.freq, t.start);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(t.vol, t.start);
      gain.gain.exponentialRampToValueAtTime(0.001, t.end);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t.start);
      osc.stop(t.end);
    }
  } catch (err) {
    console.warn('[Notifications] Sound failed:', err);
  }
}

// ── Seen tracking (localStorage) ────────────────────────────
function getSeenIds() {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'); }
  catch { return []; }
}

function markSeen(id) {
  const seen = getSeenIds();
  if (!seen.includes(id)) {
    seen.push(id);
    if (seen.length > 200) seen.splice(0, seen.length - 200);
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  }
}

function isSeen(id) {
  return getSeenIds().includes(id);
}

function getLastEmailIds() {
  try { return JSON.parse(localStorage.getItem(LAST_EMAIL_KEY) || '[]'); }
  catch { return []; }
}

function setLastEmailIds(ids) {
  localStorage.setItem(LAST_EMAIL_KEY, JSON.stringify(ids.slice(0, 30)));
}

// ── Persistent cache: restore last session's notifications instantly ──
function getCachedNotifs() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    // Valid for 10 minutes
    if (Date.now() - ts < 10 * 60 * 1000) return data;
  } catch { /* ignore */ }
  return null;
}

function setCachedNotifs(notifs) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: notifs, ts: Date.now() }));
  } catch { /* ignore */ }
}

// ── Format helpers ──────────────────────────────────────────
function formatRelative(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

// ═══════════════════════════════════════════════════════════════
// Individual source fetchers (each returns an array of notifs)
// ═══════════════════════════════════════════════════════════════

function fetchTaskNotifs() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return tasksApi.getAll().then(allTasks => {
    const notifs = [];
    const pending = (allTasks || []).filter(t => t.status !== 'done');

    for (const task of pending) {
      if (!task.due_date) continue;
      if (task.due_date === todayStr) {
        notifs.push({
          id: `task-today-${task.id}`, type: 'task',
          title: 'Tarea vence hoy', message: task.title,
          time: 'Hoy', actionUrl: '/dashboard/tareas',
          priority: task.priority === 'high' ? 2 : 1,
        });
      } else if (task.due_date < todayStr) {
        notifs.push({
          id: `task-overdue-${task.id}`, type: 'task',
          title: 'Tarea atrasada',
          message: `"${task.title}" venció el ${new Date(task.due_date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`,
          time: 'Atrasada', actionUrl: '/dashboard/tareas', priority: 3,
        });
      }
    }
    return notifs;
  }).catch(err => {
    console.warn('[SmartNotifs] Tasks:', err.message);
    return [];
  });
}

function fetchCalendarNotifs() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow); tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow); tomorrowEnd.setHours(23, 59, 59, 999);

  return calendarApi.listEvents({
    timeMin: tomorrowStart.toISOString(),
    timeMax: tomorrowEnd.toISOString(),
    maxResults: 10,
  }).then(events => {
    return events.map(event => ({
      id: `cal-tomorrow-${event.id}`, type: 'event',
      title: 'Evento mañana',
      message: `${event.summary || 'Evento sin título'} — ${
        event.start?.dateTime
          ? new Date(event.start.dateTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
          : 'Todo el día'
      }`,
      time: 'Mañana', actionUrl: '/dashboard/calendario', priority: 1,
    }));
  }).catch(err => {
    if (!err.message?.includes('NO_GOOGLE_TOKEN'))
      console.warn('[SmartNotifs] Calendar:', err.message);
    return [];
  });
}

function fetchEmailNotifs(isFirstLoad) {
  return gmailApi.listEmails({ maxResults: 5, q: 'is:unread newer_than:1d' })
    .then(({ messages }) => {
      const prevEmailIds = getLastEmailIds();
      const currentIds = messages.map(m => m.id);
      const brandNewIds = currentIds.filter(id => !prevEmailIds.includes(id));

      if (brandNewIds.length > 0 && !isFirstLoad) {
        playNotificationSound();
      }
      setLastEmailIds(currentIds);

      return messages.map(email => {
        const senderName = (email.from || '').replace(/<.*>/, '').trim() || 'Desconocido';
        return {
          id: `email-${email.id}`, type: 'email',
          title: 'Correo nuevo',
          message: `${senderName}: ${email.subject || '(Sin asunto)'}`,
          time: email.date ? formatRelative(email.date) : 'Reciente',
          actionUrl: '/dashboard/correos',
          priority: brandNewIds.includes(email.id) ? 2 : 0,
          isNew: brandNewIds.includes(email.id),
        };
      });
    }).catch(err => {
      if (!err.message?.includes('NO_GOOGLE_TOKEN'))
        console.warn('[SmartNotifs] Gmail:', err.message);
      return [];
    });
}

function fetchClassroomNotifs() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfter = new Date(now); dayAfter.setDate(dayAfter.getDate() + 2);

  return classroomApi.getAllCoursework().then(allWork => {
    const notifs = [];
    for (const cw of allWork) {
      if (!cw.dueDate) continue;
      const dueDate = new Date(cw.dueDate.year, cw.dueDate.month - 1, cw.dueDate.day);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      if (dueDate <= dayAfter && dueDate >= new Date(todayStr)) {
        const dayLabel = dueDateStr === todayStr ? 'hoy'
          : dueDateStr === tomorrowStr ? 'mañana' : 'pronto';
        notifs.push({
          id: `classroom-${cw.id}`, type: 'classroom',
          title: `Tarea de clase vence ${dayLabel}`,
          message: `${cw.title} — ${cw.courseName || 'Clase'}`,
          time: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
          actionUrl: '/dashboard/clases',
          priority: dueDateStr === todayStr ? 3 : 1,
        });
      }
    }
    return notifs;
  }).catch(err => {
    if (!err.message?.includes('NO_GOOGLE_TOKEN'))
      console.warn('[SmartNotifs] Classroom:', err.message);
    return [];
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN HOOK — Progressive loading
// ═══════════════════════════════════════════════════════════════

export function useSmartNotifications() {
  const [notifications, setNotifications] = useState(() => {
    // Restore from session cache for instant display
    const cached = getCachedNotifs();
    return cached || [];
  });
  const [loading, setLoading] = useState(() => !getCachedNotifs());
  const isFirstLoad = useRef(!getCachedNotifs());
  const pollTimerRef = useRef(null);
  const notifsRef = useRef([]); // accumulator for progressive results

  // ── Merge new notifs into current state (sorted) ──────────
  const mergeNotifs = useCallback((source, newItems) => {
    notifsRef.current = [
      ...notifsRef.current.filter(n => {
        // Remove old items from this source to replace with fresh ones
        const sourcePrefix = {
          task: 'task-', event: 'cal-', email: 'email-', classroom: 'classroom-',
        }[source] || source;
        return !n.id.startsWith(sourcePrefix);
      }),
      ...newItems,
    ];

    // Sort: highest priority first
    notifsRef.current.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Enrich with seen status
    const enriched = notifsRef.current.map(n => ({
      ...n,
      read: isSeen(n.id),
    }));

    setNotifications(enriched);
    setCachedNotifs(enriched);
    setLoading(false);
  }, []);

  // ── Fetch all sources in parallel, render progressively ───
  const fetchAll = useCallback(() => {
    const googleConnected = isGoogleConnected();
    const firstLoad = isFirstLoad.current;

    // 1. Tasks (fastest — ~200ms from Insforge DB)
    fetchTaskNotifs().then(items => mergeNotifs('task', items));

    // 2-4. Google sources (only if connected, run in parallel)
    if (googleConnected) {
      fetchCalendarNotifs().then(items => mergeNotifs('event', items));
      fetchEmailNotifs(firstLoad).then(items => mergeNotifs('email', items));
      fetchClassroomNotifs().then(items => mergeNotifs('classroom', items));
    }

    isFirstLoad.current = false;
  }, [mergeNotifs]);

  // ── Initial load + polling ────────────────────────────────
  useEffect(() => {
    fetchAll();
    pollTimerRef.current = setInterval(fetchAll, POLL_INTERVAL);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchAll]);

  // ── Actions ───────────────────────────────────────────────
  const markAsRead = useCallback((id) => {
    markSeen(id);
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      setCachedNotifs(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      prev.forEach(n => markSeen(n.id));
      const updated = prev.map(n => ({ ...n, read: true }));
      setCachedNotifs(updated);
      return updated;
    });
  }, []);

  const refresh = useCallback(() => {
    notifsRef.current = [];
    setLoading(true);
    fetchAll();
  }, [fetchAll]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh };
}

export default useSmartNotifications;
