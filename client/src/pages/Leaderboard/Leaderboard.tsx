import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getLeaderboard } from '../../features/leaderboard/api/leaderboard';
import { followUser } from '../../features/social/api/users';
import { imageUrl } from '../../utils/imageUrl';
import { LeaderboardEntry } from '../../types';
import { useAuth } from '../../features/auth';
import styles from './Leaderboard.module.css';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [period, setPeriod] = useState('alltime');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    getLeaderboard(period).then((res) => setEntries(res.data.data)).catch(() => toast.error('Failed to load leaderboard')).finally(() => setLoading(false));
  }, [period]);

  const handleFollow = async (userId: string) => {
    try { await followUser(userId); setFollowedIds((prev) => new Set(prev).add(userId)); } catch { toast.error('Failed to follow user'); }
  };

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Top Chefs</h1>
        <p className={styles.subtitle}>Celebrating the culinary masters of our digital kitchen. Discover the creators who are redefining flavor and heritage.</p>
        <div className={styles.periodTabs}>
          {['weekly', 'monthly', 'alltime'].map((p) => (
            <button key={p} className={`${styles.periodTab} ${period === p ? styles.periodTabActive : ''}`} onClick={() => setPeriod(p)}>
              {p === 'alltime' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className={styles.loading}>Loading...</div> : (
        <>
          {top3.length > 0 && (
            <div className={styles.podium}>
              {top3.length > 1 && (
                <div className={styles.podiumItem}>
                  <div className={styles.podiumRank}>2</div>
                  <img className={styles.podiumAvatar} src={imageUrl(top3[1].user.avatar) || `https://ui-avatars.com/api/?name=${top3[1].user.username}&background=F0E0D0&color=2D1810`} alt="" />
                  <div className={styles.podiumName}>{top3[1].user.username}</div>
                  <div className={styles.podiumScore}>{Math.round(top3[1].score).toLocaleString()} pts</div>
                  <div className={styles.podiumStats}>{top3[1].user.recipesCount} recipes</div>
                  <button className={styles.podiumFollowBtn} onClick={() => navigate(`/user/${top3[1].user._id}`)}>View</button>
                </div>
              )}
              <div className={`${styles.podiumItem} ${styles.podiumFirst}`}>
                <div className={styles.podiumRank}>👑 1</div>
                <img className={styles.podiumAvatar} src={imageUrl(top3[0].user.avatar) || `https://ui-avatars.com/api/?name=${top3[0].user.username}&background=F0E0D0&color=2D1810`} alt="" />
                <div className={styles.podiumName}>{top3[0].user.username}</div>
                <div className={styles.podiumScore}>{Math.round(top3[0].score).toLocaleString()} pts</div>
                <div className={styles.podiumBio}>{top3[0].user.bio}</div>
                <div className={styles.podiumStats}>{top3[0].user.followersCount} followers · {top3[0].user.recipesCount} recipes</div>
                <button className={styles.podiumFollowBtn} onClick={() => navigate(`/user/${top3[0].user._id}`)}>View Creator</button>
              </div>
              {top3.length > 2 && (
                <div className={styles.podiumItem}>
                  <div className={styles.podiumRank}>3</div>
                  <img className={styles.podiumAvatar} src={imageUrl(top3[2].user.avatar) || `https://ui-avatars.com/api/?name=${top3[2].user.username}&background=F0E0D0&color=2D1810`} alt="" />
                  <div className={styles.podiumName}>{top3[2].user.username}</div>
                  <div className={styles.podiumScore}>{Math.round(top3[2].score).toLocaleString()} pts</div>
                  <div className={styles.podiumStats}>{top3[2].user.recipesCount} recipes</div>
                  <button className={styles.podiumFollowBtn} onClick={() => navigate(`/user/${top3[2].user._id}`)}>View</button>
                </div>
              )}
            </div>
          )}

          {rest.length > 0 && (
            <>
              <h2 className={styles.listTitle}>Top Trending Creators</h2>
              <div className={styles.table}>
                {rest.map((entry) => (
                  <div key={entry.user._id} className={styles.row}>
                    <span className={styles.rank}>{entry.rank}</span>
                    <img className={`${styles.rowAvatar} ${styles.clickable}`} src={imageUrl(entry.user.avatar) || `https://ui-avatars.com/api/?name=${entry.user.username}&background=F0E0D0&color=2D1810`} alt="" onClick={() => navigate(`/user/${entry.user._id}`)} />
                    <div className={styles.rowInfo}>
                      <div className={styles.rowName}>{entry.user.username}</div>
                      {entry.user.bio && <div className={styles.rowBio}>{entry.user.bio}</div>}
                    </div>
                    <div className={styles.rowScore}>{Math.round(entry.score).toLocaleString()} pts</div>
                    <div className={styles.rowStat}>{entry.user.recipesCount} recipes</div>
                    <div className={styles.rowStat}>{entry.user.followersCount} followers</div>
                    {me && me._id !== entry.user._id && (
                      <button className={followedIds.has(entry.user._id) ? styles.rowFollowingBtn : styles.rowFollowBtn} onClick={() => handleFollow(entry.user._id)} disabled={followedIds.has(entry.user._id)}>
                        {followedIds.has(entry.user._id) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
