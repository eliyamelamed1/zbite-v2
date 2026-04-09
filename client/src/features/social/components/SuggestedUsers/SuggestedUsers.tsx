import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuggestedUsers, followUser } from '../../../../features/social/api/users';
import { imageUrl } from '../../../../utils/imageUrl';
import { User } from '../../../../types';
import toast from 'react-hot-toast';
import styles from './SuggestedUsers.module.css';

export default function SuggestedUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSuggestedUsers().then((res) => setUsers(res.data.data)).catch(() => { /* Non-critical */ });
  }, []);

  const handleFollow = async (userId: string) => {
    try {
      await followUser(userId);
      setFollowedIds((prev) => new Set(prev).add(userId));
    } catch { toast.error('Failed to follow user'); }
  };

  if (users.length === 0) return null;

  return (
    <div className={styles.widget}>
      <div className={styles.heading}>Suggested Chefs</div>
      {users.map((u) => (
        <div key={u._id} className={styles.item}>
          <img
            className={styles.avatar}
            src={imageUrl(u.avatar) || `https://ui-avatars.com/api/?name=${u.username}&background=F0E0D0&color=2D1810`}
            alt={u.username}
            onClick={() => navigate(`/user/${u._id}`)}
          />
          <div className={styles.info}>
            <div className={styles.name} onClick={() => navigate(`/user/${u._id}`)}>@{u.username}</div>
            <div className={styles.meta}>{u.followersCount} followers</div>
          </div>
          <button
            className={followedIds.has(u._id) ? styles.followingBtn : styles.followBtn}
            onClick={() => handleFollow(u._id)}
            disabled={followedIds.has(u._id)}
          >
            {followedIds.has(u._id) ? 'Following' : 'Follow'}
          </button>
        </div>
      ))}
    </div>
  );
}
