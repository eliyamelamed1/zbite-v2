import { Link, useNavigate } from 'react-router-dom';
import { imageUrl } from '../../../utils/imageUrl';
import { Recipe } from '../../../types';
import styles from '../RecipeWizard.module.css';

interface SuccessStepProps {
  recipe: Recipe;
}

export default function SuccessStep({ recipe }: SuccessStepProps): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.successPage}>
          <h1 className={styles.successTitle}>Recipe Published!</h1>
          <p className={styles.successSubtitle}>Your culinary masterpiece is now live for the world to savor.</p>
          <div className={styles.successCard}>
            <img className={styles.successImage} src={imageUrl(recipe.coverImage)} alt={recipe.title} />
            <div className={styles.successCardBody}>
              <div className={styles.successRecipeTitle}>{recipe.title}</div>
              <div className={styles.successMeta}>⏱ {recipe.cookingTime} min · 🍽 {recipe.servings} Servings</div>
            </div>
          </div>
          <div className={styles.successBtns}>
            <button className={styles.viewBtn} onClick={() => navigate(`/recipe/${recipe._id}`)}>View Recipe →</button>
            <button className={styles.shareBtn}>Share with friends</button>
          </div>
          <div className={styles.dashboardLink}><Link to="/feed">Back to Dashboard</Link></div>
        </div>
      </div>
    </div>
  );
}
