import { z } from 'zod';

// ---------------------------------------------------------------------------
// Gamification module has no body/param schemas since all routes
// derive the userId from the authenticated user. This file exists
// for consistency with the module pattern and future extensibility.
// ---------------------------------------------------------------------------

/** Empty schema — placeholder for future query params on streak/achievement routes. */
export const EmptySchema = z.object({});
export type Empty = z.infer<typeof EmptySchema>;
