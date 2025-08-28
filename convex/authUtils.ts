import { getAuthenticatedUserWithRateLimit as coreGetAuthenticatedUserWithRateLimit } from './auth';

// Canonical auth helpers live in auth.ts; re-export here for compatibility.
export {
  getAuthenticatedUser,
  validateUserAccess,
  getAuthenticatedClerkId,
  requireAuth,
} from './auth';

/**
 * Rate-limited authentication check (mutation-only helper)
 * Wraps the canonical getAuthenticatedUser and applies a DB-backed rate limit.
 */
/**
 * @deprecated Import from './auth' instead. This alias will be removed.
 */
export const getAuthenticatedUserWithRateLimit =
  coreGetAuthenticatedUserWithRateLimit;
