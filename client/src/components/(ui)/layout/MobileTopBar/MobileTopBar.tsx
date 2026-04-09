import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../features/auth';
import styles from './MobileTopBar.module.css';

export default function MobileTopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className={styles.topBar}>
      <button className={styles.iconBtn} onClick={() => navigate('/explore')}>
        <span className={styles.searchIcon}>&#128269;</span>
      </button>

      <span className={styles.logo}>zbite</span>

      <div className={styles.actions}>
        {user && (
          <>
            <button className={styles.iconBtn} onClick={() => navigate('/saved')}>
              &#128278;
            </button>
            <button className={styles.iconBtn} onClick={() => navigate('/activity')}>
              &#128276;
            </button>
          </>
        )}
      </div>
    </div>
  );
}
