const SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

/** Fallback image shown when a recipe cover fails to load. */
export const RECIPE_IMAGE_FALLBACK = 'https://picsum.photos/seed/zbite-fallback/800/600';

/** Resolves a stored image path to a full URL. */
export function imageUrl(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return SERVER_URL + path;
}

/** Sets a fallback src when an image element fails to load. */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>): void {
  const target = event.currentTarget;
  // Prevent infinite loop if fallback also fails
  if (target.src === RECIPE_IMAGE_FALLBACK) return;
  target.src = RECIPE_IMAGE_FALLBACK;
}
