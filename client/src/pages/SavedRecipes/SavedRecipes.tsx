import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Clock } from 'lucide-react';
import { getSavedRecipes } from '../../features/recipes/api/recipes';
import { imageUrl } from '../../utils/imageUrl';
import TagChips from '../../components/(ui)/forms/CategoryChips/CategoryChips';
import { Recipe } from '../../types';
import toast from 'react-hot-toast';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './SavedRecipes.module.css';

export default function SavedRecipes() {
  const navigate = useNavigate();
  const [tag, setTag] = useState('All');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSavedRecipes(1, tag !== 'All' ? tag : undefined);
      setRecipes(res.data.data);
    } catch { toast.error('Failed to load saved recipes'); } finally { setLoading(false); }
  }, [tag]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  return (
    <div className={styles.page}>
      <SEO title="Saved Recipes" description="Your bookmarked recipes." noindex />
      <h1 className={styles.title}>Your Culinary Library</h1>
      <p className={styles.subtitle}>A curated collection of your most cherished recipes and future experiments.</p>
      <div className={styles.chipsWrap}>
        <TagChips selected={tag} onChange={setTag} />
      </div>
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.grid}>
          {recipes.map((r) => (
            <div key={r._id} className={styles.card} onClick={() => navigate(`/recipe/${r._id}`)}>
              <div className={styles.cardImageWrap}>
                <img className={styles.cardImage} src={imageUrl(r.coverImage)} alt={r.title} loading="lazy" />
                <span className={styles.bookmarkIcon}><Bookmark size={14} fill="currentColor" /></span>
                <span className={`${styles.diffBadge} ${styles[r.difficulty]}`}>{r.difficulty}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{r.title}</div>
                <div className={styles.cardAuthor}>By {r.author?.username}</div>
                <div className={styles.cardMeta}>
                  <span><Clock size={12} /> {r.cookingTime} min</span>
                  {r.tags?.[0] && <span>{r.tags[0]}</span>}
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
