import { useState } from 'react';
import { Square, CheckSquare } from 'lucide-react';
import { Recipe } from '../../../../types';
import styles from '../../../../pages/RecipeDetail/RecipeDetail.module.css';

interface IngredientsSectionProps {
  ingredients: Recipe['ingredients'];
}

export default function IngredientsSection({ ingredients }: IngredientsSectionProps): JSX.Element {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Ingredients</h2>
      <ul className={styles.ingredientList}>
        {ingredients.map((ing, i) => (
          <li key={i} className={`${styles.ingredient} ${checked.has(i) ? styles.ingredientChecked : ''}`} onClick={() => toggle(i)}>
            <span className={styles.checkbox}>{checked.has(i) ? <CheckSquare size={18} /> : <Square size={18} />}</span>
            <span>{ing.amount} {ing.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
