import { useNavigate } from 'react-router-dom';
import { Clock, Bookmark } from 'lucide-react';
import { imageUrl, handleImageError } from '../../../../utils/imageUrl';
import { Recipe } from '../../../../types';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.card} onClick={() => navigate(`/recipe/${recipe._id}`)}>
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={imageUrl(recipe.coverImage)} alt={recipe.title} onError={handleImageError} loading="lazy" />
      </div>
      <div className={styles.body}>
        <div className={styles.title}>{recipe.title}</div>
        <div className={styles.author}>by @{recipe.author?.username || 'unknown'}</div>
        <div className={styles.meta}>
          <span><Clock size={12} /> {recipe.cookingTime} min</span>
          <span><Bookmark size={12} /> {recipe.savesCount} saves</span>
        </div>
        <div className={styles.bottom}>
          <span className={`${styles.difficulty} ${styles[recipe.difficulty]}`}>{recipe.difficulty}</span>
          <span className={styles.saves}>{recipe.servings} servings</span>
        </div>
      </div>
    </div>
  );
}
