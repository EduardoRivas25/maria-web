// ═══════════════════════════════════════════════════════════════
// M.A.R.I.A. — Realtime Hook
// Subscribe to Insforge Realtime channels for live updates
// on notifications, tasks, and transactions.
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react';
import { insforge } from '../insforge';

/**
 * Subscribe to real-time changes on a specific table.
 *
 * @param {string} table - Table name to subscribe to (e.g. 'notifications')
 * @param {Object} [options]
 * @param {'*'|'INSERT'|'UPDATE'|'DELETE'} [options.event='*'] - Event type
 * @param {string} [options.filter] - PostgREST-style filter (e.g. 'user_id=eq.abc')
 * @param {(payload: any) => void} options.onInsert - Callback for INSERT events
 * @param {(payload: any) => void} options.onUpdate - Callback for UPDATE events
 * @param {(payload: any) => void} options.onDelete - Callback for DELETE events
 * @param {(payload: any) => void} options.onChange - Callback for all events
 * @param {boolean} [options.enabled=true] - Whether the subscription is active
 */
export function useRealtime(table, options = {}) {
  const {
    event = '*',
    filter,
    onInsert,
    onUpdate,
    onDelete,
    onChange,
    enabled = true,
  } = options;

  const channelRef = useRef(null);

  // Stabilize callbacks via refs to avoid resubscribing on every render
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete, onChange });
  callbacksRef.current = { onInsert, onUpdate, onDelete, onChange };

  useEffect(() => {
    if (!enabled || !table) return;

    // Insforge Realtime: subscribe to table changes via channel
    try {
      const channelName = `realtime-${table}-${Date.now()}`;

      const subscriptionConfig = {
        event,
        schema: 'public',
        table,
      };
      if (filter) {
        subscriptionConfig.filter = filter;
      }

      const channel = insforge.realtime
        .channel(channelName)
        .on('postgres_changes', subscriptionConfig, (payload) => {
          const cbs = callbacksRef.current;

          // Fire specific event callbacks
          if (payload.eventType === 'INSERT' && cbs.onInsert) {
            cbs.onInsert(payload);
          } else if (payload.eventType === 'UPDATE' && cbs.onUpdate) {
            cbs.onUpdate(payload);
          } else if (payload.eventType === 'DELETE' && cbs.onDelete) {
            cbs.onDelete(payload);
          }

          // Fire generic onChange for all events
          if (cbs.onChange) {
            cbs.onChange(payload);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] Subscribed to ${table}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.warn(`[Realtime] Channel error on ${table}`);
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.warn(`[Realtime] Failed to subscribe to ${table}:`, err);
    }

    return () => {
      if (channelRef.current) {
        try {
          insforge.realtime.removeChannel(channelRef.current);
        } catch (err) {
          console.warn(`[Realtime] Error removing channel:`, err);
        }
        channelRef.current = null;
      }
    };
  }, [table, event, filter, enabled]);
}

/**
 * Subscribe to notifications in real-time.
 * Convenience wrapper around useRealtime.
 *
 * @param {string} userId - Current user ID
 * @param {Object} callbacks
 * @param {(notification: any) => void} callbacks.onNew - New notification received
 * @param {(notification: any) => void} callbacks.onRead - Notification marked as read
 */
export function useNotificationsRealtime(userId, { onNew, onRead } = {}) {
  useRealtime('notifications', {
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onInsert: (payload) => {
      onNew?.(payload.new);
    },
    onUpdate: (payload) => {
      if (payload.new?.read && !payload.old?.read) {
        onRead?.(payload.new);
      }
    },
  });
}

/**
 * Subscribe to task changes in real-time.
 *
 * @param {string} userId - Current user ID
 * @param {(payload: any) => void} onChange - Callback for any task change
 */
export function useTasksRealtime(userId, onChange) {
  useRealtime('tasks', {
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onChange,
  });
}

/**
 * Subscribe to transaction changes in real-time.
 *
 * @param {string} userId - Current user ID
 * @param {(payload: any) => void} onChange - Callback for any transaction change
 */
export function useTransactionsRealtime(userId, onChange) {
  useRealtime('transactions', {
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onChange,
  });
}

export default useRealtime;
