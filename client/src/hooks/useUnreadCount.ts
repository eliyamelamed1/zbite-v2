import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '../features/auth';
import { getUnreadCount } from '../features/social/api/notifications';
import { useNotificationStream } from './useNotificationStream';

const TOAST_MESSAGES: Record<string, string> = {
  follow: 'Someone just followed you!',
  comment: 'New comment on your recipe',
  cooking_report: 'Someone cooked your recipe!',
};

/**
 * Tracks the number of unread notifications.
 * Uses SSE for real-time updates and re-fetches on route change as fallback.
 */
export function useUnreadCount(): number {
  const { user } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      getUnreadCount().then((res) => setUnread(res.data.count)).catch(() => { /* Non-critical */ });
    }
  }, [user, location.pathname]);

  const handleNotification = useCallback((event: { type: string; isToastWorthy: boolean }) => {
    setUnread((prev) => prev + 1);

    if (event.isToastWorthy) {
      const message = TOAST_MESSAGES[event.type];
      if (message) toast(message, { icon: '🔔' });
    }
  }, []);

  useNotificationStream({ onNotification: handleNotification });

  return unread;
}
