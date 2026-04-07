import { useState, useEffect, useCallback } from 'react';
import { AxiosResponse } from 'axios';
import RecipeCard from '../RecipeCard/RecipeCard';
import { Recipe, PaginatedResponse } from '../../types';
import styles from './Feed.module.css';

interface FeedProps {
  fetchFn: (page: number) => Promise<AxiosResponse<PaginatedResponse<Recipe>>>;
  emptyTitle?: string;
  emptyText?: React.ReactNode;
}

export default function Feed({ fetchFn, emptyTitle, emptyText }: FeedProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadRecipes = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const res = await fetchFn(pageNum);
        if (pageNum === 1) {
          setRecipes(res.data.data);
        } else {
          setRecipes((prev) => [...prev, ...res.data.data]);
        }
        setTotalPages(res.data.pagination.pages);
      } catch (err) {
        console.error('Feed error:', err);
      } finally {
        setLoading(false);
      }
    },
    [fetchFn]
  );

  useEffect(() => {
    setPage(1);
    loadRecipes(1);
  }, [loadRecipes]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadRecipes(next);
  };

  if (loading && recipes.length === 0) return <div className={styles.loading}>Loading recipes...</div>;

  if (!loading && recipes.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>{emptyTitle || 'No recipes yet'}</div>
        <div className={styles.emptyText}>{emptyText || 'Check back later!'}</div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.grid}>
        {recipes.map((recipe) => (
          <RecipeCard key={recipe._id} recipe={recipe} />
        ))}
      </div>
      {page < totalPages && (
        <button className={styles.loadMore} onClick={handleLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </>
  );
}
