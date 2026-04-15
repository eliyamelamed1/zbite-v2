import { useNavigate } from 'react-router-dom';
import { Clock, Bookmark } from 'lucide-react';

import { imageUrl, handleImageError } from '../../../../utils/imageUrl';
import { getAvatarUrl } from '../../../../utils/getAvatarUrl';
import { Recipe } from '../../../../types';
import styles from './ResultCard.module.css';

interface ResultCardProps {
  recipe: Recipe;
  variant?: 'primary' | 'compact';
}

/** Recommendation card — primary (large vertical) or compact (horizontal). */
export default function ResultCard({ recipe, variant = 'primary' }: ResultCardProps) {
  const navigate = useNavigate();
  const isCompact = variant === 'compact';

  return (
    <div
      className={`${styles.card} ${isCompact ? styles.cardCompact : ''}`}
      onClick={() => navigate(`/recipe/${recipe._id}`)}
    >
      <div className={`${styles.imageWrapper} ${isCompact ? styles.imageCompact : ''}`}>
        <img
          className={styles.image}
          src={imageUrl(recipe.coverImage)}
          alt={recipe.title}
          onError={handleImageError}
          loading="lazy"
        />
        {!isCompact && (
          <>
            <span className={`${styles.difficultyBadge} ${styles[recipe.difficulty]}`}>
              {recipe.difficulty}
            </span>
            <span className={styles.categoryTag}>{recipe.tags?.[0] ?? ''}</span>
          </>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={`${styles.title} ${isCompact ? styles.titleCompact : ''}`}>{recipe.title}</h3>
        <div className={styles.meta}>
          <span><Clock size={12} /> {recipe.cookingTime} min</span>
          <span><Bookmark size={12} /> {recipe.savesCount}</span>
          {!isCompact && <span>{recipe.servings} servings</span>}
        </div>
        {!isCompact && (
          <div className={styles.authorRow}>
            <img
              className={styles.authorAvatar}
              src={getAvatarUrl(recipe.author?.avatar, recipe.author?.username ?? '')}
              alt={recipe.author?.username}
            />
            <span className={styles.authorName}>@{recipe.author?.username}</span>
          </div>
        )}
      </div>
    </div>
  );
}
