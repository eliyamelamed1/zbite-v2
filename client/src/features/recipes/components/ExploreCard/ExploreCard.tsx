import { useNavigate } from 'react-router-dom';
import { imageUrl } from '../../../../utils/imageUrl';
import { Recipe } from '../../../../types';
import styles from './ExploreCard.module.css';

interface ExploreCardProps {
  recipe: Recipe;
  isSaved?: boolean;
  onToggleSave?: (recipeId: string) => void;
}

export default function ExploreCard({ recipe, isSaved = false, onToggleSave }: ExploreCardProps) {
  const navigate = useNavigate();

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave?.(recipe._id);
  };

  return (
    <div className={styles.card} onClick={() => navigate(`/recipe/${recipe._id}`)}>
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={imageUrl(recipe.coverImage)} alt={recipe.title} />
        <span className={`${styles.difficultyBadge} ${styles[recipe.difficulty]}`}>
          {recipe.difficulty}
        </span>
        <button
          className={`${styles.heartBtn} ${isSaved ? styles.heartBtnSaved : ''}`}
          onClick={handleHeartClick}
          aria-label={isSaved ? 'Unsave recipe' : 'Save recipe'}
        >
          {isSaved ? '♥' : '♡'}
        </button>
      </div>
      <div className={styles.body}>
        <div className={styles.rating}>
          <span className={styles.star}>★</span>
          {recipe.averageRating > 0 ? recipe.averageRating : '—'}
          {recipe.ratingsCount > 0 && <span>({recipe.ratingsCount})</span>}
        </div>
        <div className={styles.title}>{recipe.title}</div>
        <div className={styles.authorRow}>
          <img
            className={styles.authorAvatar}
            src={imageUrl(recipe.author?.avatar) || `https://ui-avatars.com/api/?name=${recipe.author?.username}&size=20&background=F0E0D0&color=2D1810`}
            alt={recipe.author?.username}
          />
          <span className={styles.authorName}>{recipe.author?.username}</span>
        </div>
        <div className={styles.meta}>
          <span>⏱ {recipe.cookingTime} min</span>
          <span>🍽 {recipe.servings} srv</span>
        </div>
      </div>
    </div>
  );
}
