import { useEffect, useRef, useCallback } from 'react';

import { useAuth } from '../features/auth';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface NotificationEvent {
  id: string;
  type: string;
  isToastWorthy: boolean;
}

interface UseNotificationStreamOptions {
  onNotification: (event: NotificationEvent) => void;
}

/**
 * Connects to the SSE notification stream for the current user.
 * Auto-reconnects via EventSource built-in retry.
 * Calls `onNotification` for each incoming event.
 */
export function useNotificationStream({ onNotification }: UseNotificationStreamOptions): void {
  const { user } = useAuth();
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as NotificationEvent;
      callbackRef.current(data);
    } catch {
      // Malformed event — ignore
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const url = `${BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);

    source.addEventListener('notification', handleMessage);

    source.addEventListener('error', () => {
      // EventSource handles auto-reconnection natively.
      // If the connection fails permanently (e.g. expired token),
      // close to stop retry loop — user will reconnect on next page load.
      if (source.readyState === EventSource.CLOSED) {
        source.close();
      }
    });

    return () => {
      source.close();
    };
  }, [user, handleMessage]);
}
