import { imageUrl } from './imageUrl';

const AVATAR_FALLBACK_BG = 'F0E0D0';
const AVATAR_FALLBACK_COLOR = '2D1810';

/**
 * Return the user's avatar URL — resolves the uploaded path first,
 * falls back to a generated avatar from ui-avatars.com.
 */
export function getAvatarUrl(avatar: string | undefined, username: string): string {
  return imageUrl(avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=${AVATAR_FALLBACK_BG}&color=${AVATAR_FALLBACK_COLOR}`;
}
