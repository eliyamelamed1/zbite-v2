import { Recipe } from '../../../../types';
import styles from '../../../../pages/RecipeDetail/RecipeDetail.module.css';

interface NutritionSectionProps {
  nutrition: Recipe['nutrition'];
}

export default function NutritionSection({ nutrition }: NutritionSectionProps): JSX.Element | null {
  if (nutrition.calories <= 0 && nutrition.protein <= 0) return null;

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Nutrition Info</h2>
      <div className={styles.nutritionGrid}>
        <div className={styles.nutritionBox}><div className={styles.nutritionValue}>{nutrition.calories}</div><div className={styles.nutritionLabel}>kcal</div></div>
        <div className={styles.nutritionBox}><div className={styles.nutritionValue}>{nutrition.protein}g</div><div className={styles.nutritionLabel}>Protein</div></div>
        <div className={styles.nutritionBox}><div className={styles.nutritionValue}>{nutrition.carbs}g</div><div className={styles.nutritionLabel}>Carbs</div></div>
        <div className={styles.nutritionBox}><div className={styles.nutritionValue}>{nutrition.fat}g</div><div className={styles.nutritionLabel}>Fat</div></div>
      </div>
    </div>
  );
}
