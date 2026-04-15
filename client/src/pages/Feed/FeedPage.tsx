import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { getFollowingFeed, getExploreFeed, bulkSaveStatus, saveRecipe, unsaveRecipe } from '../../features/recipes/api/recipes';
import { useAuth } from '../../features/auth';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import ExploreCard from '../../features/recipes/components/ExploreCard/ExploreCard';
import SkeletonGrid from '../../components/(ui)/feedback/Skeleton/Skeleton';
import FilterBar from './components/FilterBar/FilterBar';
import TopChefsRow from './components/TopChefsRow/TopChefsRow';
import { Recipe } from '../../types';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './FeedPage.module.css';

import type { FeedSortKey } from './components/FilterBar/FilterBar';

export default function FeedPage(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sort, setSort] = useState<FeedSortKey>(
    (searchParams.get('sort') as FeedSortKey) || 'trending',
  );
  const [tag, setTag] = useState(searchParams.get('tag') ?? 'All');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  const fetchSavedStatus = useCallback(async (recipeList: Recipe[]) => {
    if (!user || recipeList.length === 0) return;
    try {
      const ids = recipeList.map((r) => r._id);
      const res = await bulkSaveStatus(ids);
      setSavedMap((prev) => ({ ...prev, ...res.data.savedMap }));
    } catch {
      // Saved status is non-critical
    }
  }, [user]);

  const fetchRecipes = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const isFollowing = sort === 'following';
      const res = isFollowing
        ? await getFollowingFeed(pageNum)
        : await getExploreFeed(pageNum, sort, tag !== 'All' ? tag : undefined);

      const fetched = res.data.data;
      setRecipes((prev) => (pageNum === 1 ? fetched : [...prev, ...fetched]));
      setHasMore(pageNum < res.data.pagination.pages);
      await fetchSavedStatus(fetched);
    } catch {
      toast.error('Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  }, [sort, tag, fetchSavedStatus]);

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    fetchRecipes(1);
  }, [fetchRecipes]);

  /** Keep URL search params in sync with active filters. */
  useEffect(() => {
    const params: Record<string, string> = {};
    if (sort !== 'trending') params.sort = sort;
    if (tag !== 'All') params.tag = tag;
    setSearchParams(params, { replace: true });
  }, [sort, tag, setSearchParams]);

  const handleToggleSave = async (recipeId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const isCurrentlySaved = savedMap[recipeId] ?? false;
    setSavedMap((prev) => ({ ...prev, [recipeId]: !isCurrentlySaved }));
    try {
      if (isCurrentlySaved) {
        await unsaveRecipe(recipeId);
      } else {
        await saveRecipe(recipeId);
      }
    } catch {
      setSavedMap((prev) => ({ ...prev, [recipeId]: isCurrentlySaved }));
      toast.error('Failed to update save');
    }
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchRecipes(next);
  };

  const handleSortChange = (newSort: FeedSortKey) => {
    if (newSort === 'following' && !user) {
      toast.error('Log in to see recipes from chefs you follow');
      return;
    }
    setSort(newSort);
  };

  const sentinelRef = useInfiniteScroll({
    onLoadMore: handleLoadMore,
    hasMore,
    isLoading,
  });

  const emptyMessage = sort === 'following'
    ? 'No recipes yet. Follow some chefs to see their recipes here!'
    : 'No recipes found. Try a different filter!';

  return (
    <div className={styles.page}>
      <SEO title="Your Feed" description="Recipes from chefs you follow." />
      <div className={styles.content}>
        <FilterBar
          sort={sort}
          tag={tag}
          onSortChange={handleSortChange}
          onTagChange={setTag}
        />

        <TopChefsRow />

        {isLoading && recipes.length === 0 && (
          <div className={styles.masonry}>
            <SkeletonGrid />
          </div>
        )}

        {!isLoading && recipes.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyText}>{emptyMessage}</div>
          </div>
        )}

        <div className={styles.masonry}>
          {recipes.map((recipe) => (
            <ExploreCard
              key={recipe._id}
              recipe={recipe}
            />
          ))}
        </div>

        {hasMore && recipes.length > 0 && (
          <div ref={sentinelRef} className={styles.sentinel}>
            {isLoading && <div className={styles.loadingMore}>Loading more...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
