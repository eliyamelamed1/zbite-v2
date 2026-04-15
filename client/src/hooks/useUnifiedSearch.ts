import { useState, useEffect } from 'react';

import { useDebounce } from './useDebounce';
import { searchRecipes } from '../features/recipes/api/recipes';
import { searchUsers } from '../features/social/api/users';
import { Recipe, User } from '../types';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_LENGTH = 2;
const DROPDOWN_RESULTS_LIMIT = 5;

interface UnifiedSearchResult {
  recipes: Recipe[];
  users: User[];
  isLoading: boolean;
}

/**
 * Unified search hook — debounces query, fetches matching recipes and users in parallel.
 * Returns empty results when query is shorter than SEARCH_MIN_LENGTH characters.
 */
export function useUnifiedSearch(query: string): UnifiedSearchResult {
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (debouncedQuery.trim().length < SEARCH_MIN_LENGTH) {
      setRecipes([]);
      setUsers([]);
      return;
    }

    setIsLoading(true);

    Promise.all([
      searchRecipes(debouncedQuery),
      searchUsers(debouncedQuery),
    ])
      .then(([recipeRes, userRes]) => {
        setRecipes(recipeRes.data.data.slice(0, DROPDOWN_RESULTS_LIMIT));
        setUsers(userRes.data.data.slice(0, DROPDOWN_RESULTS_LIMIT));
      })
      .catch(() => {
        setRecipes([]);
        setUsers([]);
      })
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  return { recipes, users, isLoading };
}
