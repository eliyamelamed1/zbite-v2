import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

import { imageUrl } from '../../../../utils/imageUrl';
import { MEAL_TITLE_MAP } from '../../../../utils/getMealType';
import { Recipe } from '../../../../types';
import styles from './MealSuggestion.module.css';

interface MealSuggestionItem {
  recipe: Recipe;
  source: 'saved' | 'interest' | 'popular';
}

interface MealSuggestionProps {
  mealType: string;
  suggestions: MealSuggestionItem[];
}

const SOURCE_LABELS: Record<string, string> = {
  saved: 'From your saved',
  interest: 'Matches your taste',
  popular: 'Popular pick',
};

/** Time-aware meal suggestion section for the Home page. */
export default function MealSuggestion({ mealType, suggestions }: MealSuggestionProps) {
  if (suggestions.length === 0) return null;

  const title = MEAL_TITLE_MAP[mealType as keyof typeof MEAL_TITLE_MAP] ?? mealType;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.grid}>
        {suggestions.map(({ recipe, source }) => (
          <Link key={recipe._id} to={`/recipe/${recipe._id}`} className={styles.card}>
            <img className={styles.cardImage} src={imageUrl(recipe.coverImage)} alt={recipe.title} />
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>{recipe.title}</div>
              <div className={styles.cardMeta}>
                <Clock size={12} />
                <span>{recipe.cookingTime} min</span>
                {recipe.tags[0] && <span>{recipe.tags[0]}</span>}
              </div>
              <div className={styles.sourceLabel}>{SOURCE_LABELS[source]}</div>
            </div>
          </Link>
        ))}
      </div>
      <Link to={`/feed?tag=${mealType}`} className={styles.moreLink}>Show more options</Link>
    </section>
  );
}
