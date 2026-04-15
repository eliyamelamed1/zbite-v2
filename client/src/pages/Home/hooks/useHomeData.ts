import { useState, useEffect } from 'react';

import { getHomeData } from '../../../features/recipes/api/recipes';
import { Recipe } from '../../../types';

interface InterestRow {
  interest: string;
  recipes: Recipe[];
}

interface HomeData {
  goTo: Recipe[];
  interestRows: InterestRow[];
  quickTonight: Recipe[];
  trending: Recipe[];
  newThisWeek: Recipe[];
}

interface UseHomeDataReturn {
  data: HomeData;
  isLoading: boolean;
}

const EMPTY_HOME: HomeData = {
  goTo: [],
  interestRows: [],
  quickTonight: [],
  trending: [],
  newThisWeek: [],
};

/** Fetches personalized home page data from the /home endpoint. */
export function useHomeData(): UseHomeDataReturn {
  const [data, setData] = useState<HomeData>(EMPTY_HOME);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const res = await getHomeData();
        setData(res.data);
      } catch {
        // Home page is non-critical -- fail gracefully with empty sections
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  return { data, isLoading };
}
