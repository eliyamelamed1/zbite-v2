import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExploreFeed } from '../../../../features/recipes/api/recipes';
import { imageUrl } from '../../../../utils/imageUrl';
import { Recipe } from '../../../../types';
import styles from './TrendingRecipes.module.css';

export default function TrendingRecipes() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    getExploreFeed(1, 'trending')
      .then((res) => setRecipes(res.data.data.slice(0, 4)))
      .catch(() => { /* Non-critical */ });
  }, []);

  if (recipes.length === 0) return null;

  return (
    <div className={styles.widget}>
      <div className={styles.heading}>Trending Recipes</div>
      {recipes.map((r) => (
        <div key={r._id} className={styles.item} onClick={() => navigate(`/recipe/${r._id}`)}>
          <img className={styles.thumb} src={imageUrl(r.coverImage)} alt={r.title} />
          <div className={styles.info}>
            <div className={styles.title}>{r.title}</div>
            <div className={styles.meta}>
              <span className={styles.stars}>★ {r.averageRating > 0 ? r.averageRating : '—'}</span>
              {' · '}{r.cookingTime} min
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
