const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const INVALID_TOKEN_MESSAGE = 'Invalid Google credential';
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_BASE_LENGTH = 26;

/** Verified Google user profile extracted from the access token. */
export interface GoogleUserPayload {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

/** Verifies a Google access token by fetching user info from Google's API. */
export async function verifyGoogleToken(credential: string): Promise<GoogleUserPayload> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${credential}` },
  });

  if (!response.ok) {
    throw new Error(INVALID_TOKEN_MESSAGE);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  if (!payload.email) {
    throw new Error(INVALID_TOKEN_MESSAGE);
  }

  return {
    googleId: String(payload.sub),
    email: String(payload.email),
    name: typeof payload.name === 'string' ? payload.name : '',
    picture: typeof payload.picture === 'string' ? payload.picture : '',
  };
}

/** Derives a sanitized username base from a Google name or email prefix. */
export function deriveBaseUsername(options: { name: string; email: string }): string {
  const raw = options.name || options.email.split('@')[0];
  const sanitized = raw.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  if (sanitized.length < USERNAME_MIN_LENGTH) {
    return sanitized.padEnd(USERNAME_MIN_LENGTH, 'x');
  }

  return sanitized.slice(0, USERNAME_MAX_BASE_LENGTH);
}
