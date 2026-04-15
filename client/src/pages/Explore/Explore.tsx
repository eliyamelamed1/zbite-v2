import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { getExploreFeed, bulkSaveStatus, saveRecipe, unsaveRecipe } from '../../features/recipes/api/recipes';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import TagChips from '../../components/(ui)/forms/CategoryChips/CategoryChips';
import ExploreCard from '../../features/recipes/components/ExploreCard/ExploreCard';
import { imageUrl } from '../../utils/imageUrl';
import { Recipe } from '../../types';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './Explore.module.css';

type SortOption = 'trending' | 'recent' | 'topRated' | 'quick';

export default function Explore() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortOption>('trending');
  const [tag, setTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  /** Fetch saved status for a batch of recipe IDs. */
  const fetchSavedStatus = useCallback(async (recipeList: Recipe[]) => {
    if (!user || recipeList.length === 0) return;
    try {
      const ids = recipeList.map((r) => r._id);
      const res = await bulkSaveStatus(ids);
      setSavedMap((prev) => ({ ...prev, ...res.data.savedMap }));
    } catch {
      // Saved status is non-critical — fail silently
    }
  }, [user]);

  const fetchRecipes = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await getExploreFeed(pageNum, sort, tag !== 'All' ? tag : undefined);
      const fetched = res.data.data;
      if (pageNum === 1) {
        setRecipes(fetched);
      } else {
        setRecipes((prev) => [...prev, ...fetched]);
      }
      setHasMore(pageNum < res.data.pagination.pages);
      await fetchSavedStatus(fetched);
    } catch {
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [sort, tag, fetchSavedStatus]);

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    fetchRecipes(1);
  }, [fetchRecipes]);

  const handleToggleSave = async (recipeId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const isCurrentlySaved = savedMap[recipeId] ?? false;
    // Optimistic update
    setSavedMap((prev) => ({ ...prev, [recipeId]: !isCurrentlySaved }));
    try {
      if (isCurrentlySaved) {
        await unsaveRecipe(recipeId);
      } else {
        await saveRecipe(recipeId);
      }
    } catch {
      // Revert on failure
      setSavedMap((prev) => ({ ...prev, [recipeId]: isCurrentlySaved }));
      toast.error('Failed to update save');
    }
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchRecipes(next);
  };

  const filteredRecipes = debouncedSearch.trim()
    ? recipes.filter((r) => r.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
    : recipes;

  const MAX_ITEMLIST_ENTRIES = 10;
  const itemListJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Explore Recipes',
    itemListElement: filteredRecipes.slice(0, MAX_ITEMLIST_ENTRIES).map((recipe, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Recipe',
        name: recipe.title,
        url: `/recipe/${recipe._id}`,
        image: imageUrl(recipe.coverImage),
      },
    })),
  }), [filteredRecipes]);

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'trending', label: 'Trending' },
    { key: 'recent', label: 'Recent' },
    { key: 'topRated', label: 'Top Rated' },
    { key: 'quick', label: 'Quick (<30min)' },
  ];

  return (
    <div className={styles.page}>
      <SEO title="Explore Recipes" description="Browse trending recipes by cuisine, diet, and cooking time." jsonLd={itemListJsonLd} />
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
        <TagChips selected={tag} onChange={setTag} />
      </div>

      {/* Mobile header */}
      <div className={styles.mobileSearch}>
        <input
          className={styles.searchInput}
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className={styles.mobileHeading}>Trending now</div>
      <div className={styles.mobileSubtitle}>Curated masterpieces from our kitchen</div>
      <div style={{ marginBottom: 16 }}>
        <TagChips selected={tag} onChange={setTag} />
      </div>

      {loading && recipes.length === 0 && (
        <div className={styles.loading}>Loading recipes...</div>
      )}

      {!loading && filteredRecipes.length === 0 && (
        <div className={styles.empty}>No recipes found. Try a different filter!</div>
      )}

      <div className={styles.masonry}>
        {filteredRecipes.map((recipe) => (
          <ExploreCard
            key={recipe._id}
            recipe={recipe}
          />
        ))}
      </div>

      {hasMore && filteredRecipes.length > 0 && !debouncedSearch.trim() && (
        <button className={styles.loadMore} onClick={handleLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Reveal More Treasures'}
        </button>
      )}
    </div>
  );
}
