import { useNavigate } from 'react-router-dom';

import { useRecommendations } from './hooks/useRecommendations';
import ResultCard from './components/ResultCard/ResultCard';
import ResultSkeleton from './components/ResultSkeleton/ResultSkeleton';
import { CATEGORY_OPTIONS } from '../../utils/constants';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './Results.module.css';

/** Displays recommended recipes with optional "Your Go-To" section for logged-in users. */
export default function Results() {
  const navigate = useNavigate();
  const { recipes, usuals, isLoading, hasMore, category, mode, minTime, maxTime, loadMore } = useRecommendations();

  const headerLabel = mode === 'pantry'
    ? 'Ingredient Match'
    : CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? 'Recipes';

  const timeLabel = minTime && maxTime
    ? `${minTime}–${maxTime} min`
    : maxTime
      ? `Under ${maxTime} min`
      : minTime
        ? `${minTime}+ min`
        : '';

  const handleStartOver = () => {
    navigate('/choose');
  };

  return (
    <div className={styles.page}>
      <SEO title="Recipe Picks" description="Personalized recipe recommendations based on your preferences." />
      <div className={styles.header}>
        <h1 className={styles.title}>Your Picks</h1>
        <span className={styles.filterChip}>{headerLabel}</span>
        {timeLabel && <span className={styles.filterChip}>{timeLabel}</span>}
      </div>

      {isLoading && recipes.length === 0 && <ResultSkeleton />}

      {!isLoading && recipes.length === 0 && (
        <div className={styles.empty}>
          <p>No recipes match your filters. Try different options!</p>
          <button className={styles.startOverBtn} onClick={handleStartOver}>
            Start Over
          </button>
        </div>
      )}

      {usuals.length > 0 && (
        <section className={styles.usualsSection}>
          <h2 className={styles.usualsTitle}>Your Go-To</h2>
          <div className={styles.usualsRow}>
            {usuals.map((recipe) => (
              <ResultCard key={recipe._id} recipe={recipe} variant="compact" />
            ))}
          </div>
        </section>
      )}

      {recipes.length > 0 && (
        <>
          <ResultCard recipe={recipes[0]} variant="primary" />
          {recipes.length > 1 && (
            <div className={styles.alternatives}>
              <h2 className={styles.altTitle}>More Options</h2>
              <div className={styles.altGrid}>
                {recipes.slice(1).map((recipe) => (
                  <ResultCard key={recipe._id} recipe={recipe} variant="compact" />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className={styles.actions}>
        {hasMore && recipes.length > 0 && (
          <button className={styles.moreBtn} onClick={loadMore} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Show More'}
          </button>
        )}
        <button className={styles.startOverLink} onClick={handleStartOver}>
          Start Over
        </button>
      </div>
    </div>
  );
}
