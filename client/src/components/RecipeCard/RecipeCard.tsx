import { useNavigate } from 'react-router-dom';
import { imageUrl } from '../../utils/imageUrl';
import { Recipe } from '../../types';
import styles from './RecipeCard.module.css';

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate();

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let stars = '';
    for (let i = 0; i < full; i++) stars += '\u2605';
    if (half) stars += '\u2606';
    for (let i = stars.length; i < 5; i++) stars += '\u2606';
    return stars;
  };

  return (
    <div className={styles.card} onClick={() => navigate(`/recipe/${recipe._id}`)}>
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={imageUrl(recipe.coverImage)} alt={recipe.title} />
      </div>
      <div className={styles.body}>
        <div className={styles.title}>{recipe.title}</div>
        <div className={styles.author}>by @{recipe.author?.username || 'unknown'}</div>
        <div className={styles.meta}>
          <span className={styles.stars}>{renderStars(recipe.averageRating)} {recipe.averageRating > 0 ? recipe.averageRating : ''}</span>
          <span>{recipe.cookingTime} min</span>
        </div>
        <div className={styles.bottom}>
          <span className={`${styles.difficulty} ${styles[recipe.difficulty]}`}>{recipe.difficulty}</span>
          <span className={styles.saves}>{recipe.servings} servings</span>
        </div>
      </div>
    </div>
  );
}
