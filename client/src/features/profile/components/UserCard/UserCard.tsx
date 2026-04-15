import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../features/auth';
import { getAvatarUrl } from '../../../../utils/getAvatarUrl';
import { User } from '../../../../types';
import styles from './UserCard.module.css';

interface UserCardProps {
  user: User;
  isFollowing?: boolean;
  onFollowToggle?: (userId: string) => void;
}

export default function UserCard({ user: u, isFollowing, onFollowToggle }: UserCardProps) {
  const navigate = useNavigate();
  const { user: me } = useAuth();

  return (
    <div className={styles.card}>
      <img
        className={styles.avatar}
        src={getAvatarUrl(u.avatar, u.username)}
        alt={u.username}
      />
      <div className={styles.info}>
        <div className={styles.username} onClick={() => navigate(`/user/${u._id}`)}>@{u.username}</div>
        {u.bio && <div className={styles.bio}>{u.bio}</div>}
        <div className={styles.followers}>{u.followersCount || 0} followers</div>
      </div>
      {me && me._id !== u._id && onFollowToggle && (
        <button className={isFollowing ? styles.unfollowBtn : styles.followBtn} onClick={() => onFollowToggle(u._id)}>
          {isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      )}
    </div>
  );
}
