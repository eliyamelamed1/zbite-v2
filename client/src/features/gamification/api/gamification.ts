import api from '../../../api/axios';

import type { CookingStreak, Achievement } from '../../../types';

/** Record a cook — auto-updates streak and may unlock achievements. */
export async function recordCook(recipeId: string): Promise<void> {
  await api.post('/gamification/cook', { recipeId });
}

/** Fetch the current user's cooking streak stats. */
export async function getMyStreak(): Promise<CookingStreak> {
  const { data } = await api.get<CookingStreak>('/gamification/streaks/me');
  return data;
}

/** Fetch the current user's unlocked achievements. */
export async function getMyAchievements(): Promise<Achievement[]> {
  const { data } = await api.get<Achievement[]>('/gamification/achievements/me');
  return data;
}

/** Fetch any user's unlocked achievements (public endpoint). */
export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const { data } = await api.get<Achievement[]>(`/gamification/achievements/${userId}`);
  return data;
}
