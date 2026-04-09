import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { getFollowing } from '../../features/social/api/users';
import { imageUrl } from '../../utils/imageUrl';
import { User } from '../../types';
import styles from './Following.module.css';

/** Paginated following list for a user. */
export default function FollowingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchFollowing = useCallback(async (pageNum: number) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getFollowing(id, pageNum);
      if (pageNum === 1) {
        setUsers(res.data.data as unknown as User[]);
      } else {
        setUsers((prev) => [...prev, ...(res.data.data as unknown as User[])]);
      }
      setHasMore(pageNum < res.data.pagination.pages);
    } catch {
      toast.error('Failed to load following');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFollowing(1);
  }, [fetchFollowing]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchFollowing(next);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(`/user/${id}`)}>
          ← Back
        </button>
        <h1 className={styles.title}>Following</h1>
      </div>

      {loading && users.length === 0 && (
        <div className={styles.loading}>Loading...</div>
      )}

      {!loading && users.length === 0 && (
        <div className={styles.empty}>Not following anyone yet</div>
      )}

      <div className={styles.list}>
        {users.map((user) => (
          <div
            key={user._id}
            className={styles.userRow}
            onClick={() => navigate(`/user/${user._id}`)}
          >
            <img
              className={styles.avatar}
              src={imageUrl(user.avatar) || `https://ui-avatars.com/api/?name=${user.username}&size=44&background=F0E0D0&color=2D1810`}
              alt={user.username}
            />
            <div className={styles.info}>
              <span className={styles.username}>@{user.username}</span>
              <span className={styles.meta}>{user.followersCount} followers</span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && users.length > 0 && (
        <button className={styles.loadMore} onClick={handleLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}
