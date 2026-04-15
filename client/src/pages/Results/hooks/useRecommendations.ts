import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getPickRecommendations, getPantryRecommendations } from '../../../features/recipes/api/recipes';
import { Recipe } from '../../../types';

interface UseRecommendationsReturn {
  recipes: Recipe[];
  usuals: Recipe[];
  isLoading: boolean;
  hasMore: boolean;
  category: string;
  mode: string;
  minTime: number | undefined;
  maxTime: number | undefined;
  loadMore: () => void;
}

/** Reads mode/category/ingredients from URL params, fetches recommendations, and manages pagination. */
export function useRecommendations(): UseRecommendationsReturn {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') ?? 'pick';
  const category = searchParams.get('category') ?? '';
  const minTime = Number(searchParams.get('minTime')) || undefined;
  const maxTime = Number(searchParams.get('maxTime')) || undefined;
  const preference = searchParams.get('preference') ?? undefined;
  const ingredientsParam = searchParams.get('ingredients') ?? '';

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [usuals, setUsuals] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecipes = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const res = mode === 'pantry'
        ? await getPantryRecommendations(
            pageNum,
            ingredientsParam.split(',').map((s) => s.trim()).filter(Boolean),
            maxTime,
          )
        : await getPickRecommendations(pageNum, category, minTime, maxTime, preference);

      const fetched = res.data.data;
      const fetchedUsuals = res.data.usuals ?? [];

      if (pageNum === 1) {
        setRecipes(fetched);
        setUsuals(fetchedUsuals);
      } else {
        setRecipes((prev) => [...prev, ...fetched]);
      }
      setHasMore(pageNum < res.data.pagination.pages);
    } catch {
      // Error state handled by empty recipes list in UI
    } finally {
      setIsLoading(false);
    }
  }, [mode, category, minTime, maxTime, preference, ingredientsParam]);

  useEffect(() => {
    setPage(1);
    setRecipes([]);
    setUsuals([]);
    fetchRecipes(1);
  }, [fetchRecipes]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchRecipes(next);
  };

  return { recipes, usuals, isLoading, hasMore, category, mode, minTime, maxTime, loadMore };
}
