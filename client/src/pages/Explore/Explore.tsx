import { useState, useEffect, useCallback } from 'react';
import { getExploreFeed } from '../../api/recipes';
import CategoryChips from '../../components/CategoryChips/CategoryChips';
import ExploreCard from '../../components/ExploreCard/ExploreCard';
import { Recipe } from '../../types';
import styles from './Explore.module.css';

type SortOption = 'trending' | 'recent' | 'topRated' | 'quick';

export default function Explore() {
  const [sort, setSort] = useState<SortOption>('trending');
  const [category, setCategory] = useState('All');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await getExploreFeed(pageNum, sort, category !== 'All' ? category : undefined);
      if (pageNum === 1) {
        setRecipes(res.data.data);
      } else {
        setRecipes((prev) => [...prev, ...res.data.data]);
      }
      setHasMore(pageNum < res.data.pagination.pages);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [sort, category]);

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    fetchRecipes(1);
  }, [fetchRecipes]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchRecipes(next);
  };

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'trending', label: 'Trending' },
    { key: 'recent', label: 'Recent' },
    { key: 'topRated', label: 'Top Rated' },
    { key: 'quick', label: 'Quick (<30min)' },
  ];

  return (
    <div className={styles.page}>
      {/* Desktop header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Curation <span className={styles.titleAccent}>Explore</span></h1>
        <p className={styles.subtitle}>
          Discover hand-picked culinary treasures from our global community of digital curators.
        </p>
        <div className={styles.filters}>
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              className={`${styles.filterPill} ${sort === opt.key ? styles.filterPillActive : ''}`}
              onClick={() => setSort(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <CategoryChips selected={category} onChange={setCategory} />
      </div>

      {/* Mobile header */}
      <div className={styles.mobileSearch}>
        <input className={styles.searchInput} placeholder="Search recipes..." readOnly />
      </div>
      <div className={styles.mobileHeading}>Trending now</div>
      <div className={styles.mobileSubtitle}>Curated masterpieces from our kitchen</div>
      <div style={{ display: 'block' }}>
        <div className={styles.masonry} style={{ marginBottom: 0 }}>
          {/* Mobile category chips — visible on mobile via inline */}
        </div>
      </div>
      <div style={{ marginBottom: 16 }} className={styles.mobileSearch ? '' : ''}>
        <CategoryChips selected={category} onChange={setCategory} />
      </div>

      {loading && recipes.length === 0 && (
        <div className={styles.loading}>Loading recipes...</div>
      )}

      {!loading && recipes.length === 0 && (
        <div className={styles.empty}>No recipes found. Try a different filter!</div>
      )}

      <div className={styles.masonry}>
        {recipes.map((recipe) => (
          <ExploreCard key={recipe._id} recipe={recipe} />
        ))}
      </div>

      {hasMore && recipes.length > 0 && (
        <button className={styles.loadMore} onClick={handleLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Reveal More Treasures'}
        </button>
      )}
    </div>
  );
}
