import UserActivity from '../../models/UserActivity';

type ActivityAction = 'view' | 'save' | 'cook';

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Record a user activity event. Fire-and-forget — never blocks the caller.
 *
 * Views are deduplicated: if the same user viewed the same recipe within the last
 * hour, the duplicate is silently dropped. Save and cook events are always recorded.
 */
export function trackActivity(userId: string, action: ActivityAction, recipeId: string): void {
  trackActivityAsync(userId, action, recipeId).catch(() => {
    // Intentionally swallowed — tracking must never break user-facing flows
  });
}

async function trackActivityAsync(userId: string, action: ActivityAction, recipeId: string): Promise<void> {
  if (action === 'view') {
    const oneHourAgo = new Date(Date.now() - ONE_HOUR_MS);
    const recent = await UserActivity.findOne({
      user: userId,
      action: 'view',
      recipe: recipeId,
      createdAt: { $gte: oneHourAgo },
    });

    if (recent) return;
  }

  await UserActivity.create({ user: userId, action, recipe: recipeId });
}
