import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../features/auth';
import { getUnreadCount } from '../features/social/api/notifications';

/**
 * Tracks the number of unread notifications.
 * Re-fetches on every route change so the badge stays current.
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

  return unread;
}
