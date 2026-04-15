import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getLeaderboard } from '../../../../features/leaderboard/api/leaderboard';
import { getAvatarUrl } from '../../../../utils/getAvatarUrl';
import { LeaderboardEntry } from '../../../../types';
import styles from './TopChefsRow.module.css';

const TOP_CHEFS_COUNT = 5;

/** Horizontal row of top-ranked chef avatars with rank badges. */
export default function TopChefsRow() {
  const navigate = useNavigate();
  const [chefs, setChefs] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    getLeaderboard('alltime')
      .then((res) => setChefs(res.data.data.slice(0, TOP_CHEFS_COUNT)))
      .catch(() => {
        // Non-critical — fail silently
      });
  }, []);

  if (chefs.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Top Chefs</h3>
        <Link to="/leaderboard" className={styles.seeAll}>See all</Link>
      </div>
      <div className={styles.row}>
        {chefs.map((entry) => (
          <button
            key={entry.user._id}
            className={styles.chef}
            onClick={() => navigate(`/user/${entry.user._id}`)}
          >
            <div className={styles.avatarWrapper}>
              <img
                className={styles.avatar}
                src={getAvatarUrl(entry.user.avatar, entry.user.username)}
                alt={entry.user.username}
              />
              <span className={styles.rankBadge}>{entry.rank}</span>
            </div>
            <span className={styles.name}>{entry.user.username}</span>
            <span className={styles.score}>{Math.round(entry.score)} pts</span>
          </button>
        ))}
      </div>
    </section>
  );
}
