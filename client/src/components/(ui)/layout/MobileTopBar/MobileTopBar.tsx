import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Bell } from 'lucide-react';
import { useAuth } from '../../../../features/auth';
import styles from './MobileTopBar.module.css';

export default function MobileTopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className={styles.topBar}>
      <span className={styles.logo}>zbite</span>

      <button className={styles.searchBar} onClick={() => navigate('/search')}>
        <Search size={16} />
        <span>Search recipes & chefs...</span>
      </button>

      <div className={styles.actions}>
        {user && (
          <>
            <button className={styles.iconBtn} onClick={() => navigate('/shopping-list')}>
              <ShoppingCart size={20} />
            </button>
            <button className={styles.iconBtn} onClick={() => navigate('/activity')}>
              <Bell size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
