import { useNavigate } from 'react-router-dom';
import { Clock, Bookmark } from 'lucide-react';
import { imageUrl, handleImageError } from '../../../../utils/imageUrl';
import { getAvatarUrl } from '../../../../utils/getAvatarUrl';
import { Recipe } from '../../../../types';
import styles from './ExploreCard.module.css';

interface ExploreCardProps {
  recipe: Recipe;
  variant?: 'full' | 'minimal';
}

export default function ExploreCard({ recipe, variant = 'full' }: ExploreCardProps) {
  const navigate = useNavigate();
  const isMinimal = variant === 'minimal';

  return (
    <div
      className={`${styles.card} ${isMinimal ? styles.cardMinimal : ''}`}
      onClick={() => navigate(`/recipe/${recipe._id}`)}
    >
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={imageUrl(recipe.coverImage)} alt={recipe.title} onError={handleImageError} loading="lazy" />
        {!isMinimal && (
          <span className={`${styles.difficultyBadge} ${styles[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.title}>{recipe.title}</div>
        {!isMinimal && (
          <div className={styles.authorRow}>
            <img
              className={styles.authorAvatar}
              src={getAvatarUrl(recipe.author?.avatar, recipe.author?.username ?? '')}
              alt={recipe.author?.username}
            />
            <span className={styles.authorName}>@{recipe.author?.username}</span>
          </div>
        )}
        <div className={styles.meta}>
          <span className={styles.metaBold}><Clock size={12} /> {recipe.cookingTime} min</span>
          {!isMinimal && <span><Bookmark size={12} /> {recipe.savesCount}</span>}
        </div>
        {!isMinimal && recipe.tags.length > 0 && (
          <div className={styles.tags}>
            {recipe.tags.slice(0, 2).map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
            {recipe.tags.length > 2 && (
              <span className={styles.tag}>+{recipe.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
