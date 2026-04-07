import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedRecipes } from '../../api/recipes';
import { imageUrl } from '../../utils/imageUrl';
import CategoryChips from '../../components/CategoryChips/CategoryChips';
import { Recipe } from '../../types';
import styles from './SavedRecipes.module.css';

export default function SavedRecipes() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('All');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSavedRecipes(1, category !== 'All' ? category : undefined);
      setRecipes(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [category]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your Culinary Library</h1>
      <p className={styles.subtitle}>A curated collection of your most cherished recipes and future experiments.</p>
      <div style={{ marginBottom: 20 }}>
        <CategoryChips selected={category} onChange={setCategory} />
      </div>
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.grid}>
          {recipes.map((r) => (
            <div key={r._id} className={styles.card} onClick={() => navigate(`/recipe/${r._id}`)}>
              <div style={{ position: 'relative' }}>
                <img className={styles.cardImage} src={imageUrl(r.coverImage)} alt={r.title} />
                <span className={styles.bookmarkIcon}>🔖</span>
                <span className={`${styles.diffBadge} ${styles[r.difficulty]}`}>{r.difficulty}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{r.title}</div>
                <div className={styles.cardAuthor}>By {r.author?.username}</div>
                <div className={styles.cardMeta}>
                  <span className={styles.stars}>★ {r.averageRating > 0 ? r.averageRating : '—'}</span>
                  <span>⏱ {r.cookingTime} min</span>
                  {r.category && <span>🏷 {r.category}</span>}
                </div>
              </div>
            </div>
          ))}
          <div className={styles.emptyCard} onClick={() => navigate('/explore')}>
            <span className={styles.emptyIcon}>+</span>
            <span className={styles.emptyText}>Save more inspirations</span>
          </div>
        </div>
      )}
    </div>
  );
}
