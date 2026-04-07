import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getComments, createComment } from '../../api/comments';
import { imageUrl } from '../../utils/imageUrl';
import { timeAgo } from '../../utils/timeAgo';
import { Comment } from '../../types';
import styles from './CommentSection.module.css';

interface CommentSectionProps {
  recipeId: string;
}

export default function CommentSection({ recipeId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    getComments(recipeId, 1).then((res) => {
      setComments(res.data.data);
      setHasMore(1 < res.data.pagination.pages);
    }).catch((err) => console.error(err));
  }, [recipeId]);

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const res = await createComment(recipeId, text.trim());
      setComments((prev) => [res.data.comment, ...prev]);
      setText('');
    } catch (err) { console.error(err); } finally {
      setPosting(false);
    }
  };

  const handleLoadMore = async () => {
    const next = page + 1;
    const res = await getComments(recipeId, next);
    setComments((prev) => [...prev, ...res.data.data]);
    setPage(next);
    setHasMore(next < res.data.pagination.pages);
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.heading}>Comments ({comments.length})</h2>

      {user && (
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          />
          <button className={styles.postBtn} onClick={handlePost} disabled={posting || !text.trim()}>
            Post
          </button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        {comments.map((c) => (
          <div key={c._id} className={styles.comment}>
            <img
              className={styles.avatar}
              src={imageUrl(c.user.avatar) || `https://ui-avatars.com/api/?name=${c.user.username}&size=32&background=F0E0D0&color=2D1810`}
              alt={c.user.username}
            />
            <div className={styles.commentBody}>
              <span className={styles.commentUser}>@{c.user.username}</span>
              <span className={styles.commentTime}>{timeAgo(c.createdAt)}</span>
              <div className={styles.commentText}>{c.text}</div>
            </div>
          </div>
        ))}
        {hasMore && <button className={styles.loadMore} onClick={handleLoadMore}>View more comments</button>}
      </div>
    </div>
  );
}
