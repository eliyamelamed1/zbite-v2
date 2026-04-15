import { useState, useEffect } from 'react';

import api from '../../../api/axios';
import { Recipe } from '../../../types';
import { getMealType } from '../../../utils/getMealType';

interface MealSuggestion {
  recipe: Recipe;
  source: 'saved' | 'interest' | 'popular';
}

interface UseMealSuggestionReturn {
  suggestions: MealSuggestion[];
  mealType: string;
  isLoading: boolean;
}

/** Fetches time-aware meal suggestions from the API. */
export function useMealSuggestion(): UseMealSuggestionReturn {
  const mealType = getMealType();
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const { data } = await api.get('/recipes/meal-suggestion', { params: { mealType } });
        setSuggestions(data.suggestions);
      } catch {
        // Non-critical — section just won't render
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestions();
  }, [mealType]);

  return { suggestions, mealType, isLoading };
}
