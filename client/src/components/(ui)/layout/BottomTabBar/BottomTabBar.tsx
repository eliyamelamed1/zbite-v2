import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, Bell, User, Plus } from 'lucide-react';

import { useAuth } from '../../../../features/auth';
import { useUnreadCount } from '../../../../hooks/useUnreadCount';
import styles from './BottomTabBar.module.css';

export default function BottomTabBar(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const unread = useUnreadCount();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={styles.tabBar}>
      <button
        className={`${styles.tab} ${location.pathname === '/' ? styles.tabActive : ''}`}
        onClick={() => navigate('/')}
      >
        <span className={styles.tabIcon}><Home size={20} /></span>
        <span>Home</span>
      </button>

      <button
        className={`${styles.tab} ${isActive('/feed') ? styles.tabActive : ''}`}
        onClick={() => navigate('/feed')}
      >
        <span className={styles.tabIcon}><Compass size={20} /></span>
        <span>Explore</span>
      </button>

      <button className={styles.createTab} onClick={() => navigate('/recipe/new')}>
        <div className={styles.createCircle}>
          <span className={styles.createIcon}><Plus size={22} /></span>
        </div>
      </button>

      <button
        className={`${styles.tab} ${isActive('/activity') ? styles.tabActive : ''}`}
        onClick={() => navigate('/activity')}
      >
        <span className={styles.tabIcon}><Bell size={20} /></span>
        {unread > 0 && <span className={styles.badge} />}
        <span>Activity</span>
      </button>

      <button
        className={`${styles.tab} ${isActive(`/user/${user?._id}`) ? styles.tabActive : ''}`}
        onClick={() => user && navigate(`/user/${user._id}`)}
      >
        <span className={styles.tabIcon}><User size={20} /></span>
        <span>Profile</span>
      </button>
    </div>
  );
}
