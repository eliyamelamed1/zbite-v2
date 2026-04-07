import { useState } from 'react';
import { LIKE_ANIMATION_MS } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { likeRecipe, unlikeRecipe } from '../../api/likes';
import { saveRecipe, unsaveRecipe } from '../../api/recipes';
import styles from './ActionBar.module.css';

interface ActionBarProps {
  recipeId: string;
  liked: boolean;
  likesCount: number;
  saved: boolean;
  commentsCount?: number;
  onLikeChange?: (liked: boolean, count: number) => void;
  onSaveChange?: (saved: boolean) => void;
}

export default function ActionBar({ recipeId, liked, likesCount, saved, commentsCount, onLikeChange, onSaveChange }: ActionBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [animating, setAnimating] = useState(false);

  const handleLike = async () => {
    if (!user) return navigate('/login');
    try {
      if (liked) {
        await unlikeRecipe(recipeId);
        onLikeChange?.(false, likesCount - 1);
      } else {
        await likeRecipe(recipeId);
        setAnimating(true);
        setTimeout(() => setAnimating(false), LIKE_ANIMATION_MS);
        onLikeChange?.(true, likesCount + 1);
      }
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    if (!user) return navigate('/login');
    try {
      if (saved) {
        await unsaveRecipe(recipeId);
        onSaveChange?.(false);
      } else {
        await saveRecipe(recipeId);
        onSaveChange?.(true);
      }
    } catch (err) { console.error(err); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/recipe/${recipeId}`;
    if (navigator.share) {
      await navigator.share({ url }).catch((err) => console.error(err));
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className={styles.bar}>
      <button
        className={`${styles.btn} ${liked ? styles.liked : ''} ${animating ? styles.heartAnim : ''}`}
        onClick={handleLike}
      >
        {liked ? '\u2764\uFE0F' : '\u2661'}
      </button>
      <button className={styles.btn} onClick={() => navigate(`/recipe/${recipeId}`)}>
        &#128172;
      </button>
      <button className={styles.btn} onClick={handleShare}>
        &#8599;
      </button>
      <span className={styles.spacer} />
      <button
        className={`${styles.btn} ${saved ? styles.saved : ''}`}
        onClick={handleSave}
      >
        {saved ? '\u{1F516}' : '\u{1F517}'}
      </button>
    </div>
  );
}
