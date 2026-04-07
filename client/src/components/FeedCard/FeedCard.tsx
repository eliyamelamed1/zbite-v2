import { useState, useRef } from 'react';
import { DOUBLE_TAP_THRESHOLD_MS, HEART_ANIMATION_MS } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';
import { imageUrl } from '../../utils/imageUrl';
import { timeAgo } from '../../utils/timeAgo';
import { useAuth } from '../../hooks/useAuth';
import { likeRecipe } from '../../api/likes';
import ActionBar from '../ActionBar/ActionBar';
import { Recipe } from '../../types';
import styles from './FeedCard.module.css';

interface FeedCardProps {
  recipe: Recipe;
  liked: boolean;
  saved: boolean;
  onUpdate?: (id: string, updates: Partial<{ liked: boolean; likesCount: number; saved: boolean }>) => void;
}

export default function FeedCard({ recipe, liked, saved, onUpdate }: FeedCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);

  const handleDoubleTap = async () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_THRESHOLD_MS) {
      // Double tap
      if (!liked && user) {
        try {
          await likeRecipe(recipe._id);
          onUpdate?.(recipe._id, { liked: true, likesCount: recipe.likesCount + 1 });
        } catch (err) { console.error(err); }
      }
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), HEART_ANIMATION_MS);
    }
    lastTapRef.current = now;
  };

  return (
    <div className={styles.card}>
      <div className={styles.authorRow}>
        <img
          className={styles.avatar}
          src={imageUrl(recipe.author.avatar) || `https://ui-avatars.com/api/?name=${recipe.author.username}&background=F0E0D0&color=2D1810`}
          alt={recipe.author.username}
          onClick={() => navigate(`/user/${recipe.author._id}`)}
        />
        <div className={styles.authorInfo}>
          <div className={styles.authorName} onClick={() => navigate(`/user/${recipe.author._id}`)}>
            @{recipe.author.username}
          </div>
          <div className={styles.timeAgo}>{timeAgo(recipe.createdAt)}</div>
        </div>
      </div>

      <div className={styles.imageWrapper} onClick={handleDoubleTap}>
        <img className={styles.image} src={imageUrl(recipe.coverImage)} alt={recipe.title} />
        <span className={`${styles.heartOverlay} ${showHeart ? styles.heartOverlayShow : ''}`}>
          ❤️
        </span>
      </div>

      <div className={styles.body}>
        <ActionBar
          recipeId={recipe._id}
          liked={liked}
          likesCount={recipe.likesCount}
          saved={saved}
          commentsCount={recipe.commentsCount}
          onLikeChange={(newLiked, newCount) => onUpdate?.(recipe._id, { liked: newLiked, likesCount: newCount })}
          onSaveChange={(newSaved) => onUpdate?.(recipe._id, { saved: newSaved })}
        />
        {recipe.likesCount > 0 && (
          <div className={styles.likesCount}>{recipe.likesCount} {recipe.likesCount === 1 ? 'like' : 'likes'}</div>
        )}
        <div className={styles.title} onClick={() => navigate(`/recipe/${recipe._id}`)}>
          {recipe.title}
        </div>
        <div className={styles.description}>{recipe.description}</div>
        <div className={styles.chips}>
          <span className={styles.chip}>⏱ {recipe.cookingTime} min</span>
          <span className={styles.chip}>🍽 {recipe.servings} servings</span>
          {recipe.category && <span className={styles.chip}>{recipe.category}</span>}
        </div>
      </div>
    </div>
  );
}
