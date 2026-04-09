import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../features/auth';
import { useState, useEffect } from 'react';
import { getUnreadCount } from '../../../../features/social/api/notifications';
import styles from './BottomTabBar.module.css';

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      getUnreadCount().then((res) => setUnread(res.data.count)).catch(() => { /* Non-critical */ });
    }
  }, [user, location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={styles.tabBar}>
      <button
        className={`${styles.tab} ${isActive('/feed') ? styles.tabActive : ''}`}
        onClick={() => navigate('/feed')}
      >
        <span className={styles.tabIcon}>&#9750;</span>
        <span>Home</span>
      </button>

      <button className={styles.createTab} onClick={() => navigate('/recipe/new')}>
        <div className={styles.createCircle}>
          <span className={styles.createIcon}>+</span>
        </div>
      </button>

      <button
        className={`${styles.tab} ${isActive('/activity') ? styles.tabActive : ''}`}
        onClick={() => navigate('/activity')}
      >
        <span className={styles.tabIcon}>&#128276;</span>
        {unread > 0 && <span className={styles.badge} />}
        <span>Activity</span>
      </button>

      <button
        className={`${styles.tab} ${isActive(`/user/${user?._id}`) ? styles.tabActive : ''}`}
        onClick={() => user && navigate(`/user/${user._id}`)}
      >
        <span className={styles.tabIcon}>&#128100;</span>
        <span>Profile</span>
      </button>
    </div>
  );
}
