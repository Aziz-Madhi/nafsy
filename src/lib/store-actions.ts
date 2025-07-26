/**
 * Example store actions using Result pattern for error handling
 * Demonstrates how to implement error handling in Zustand stores
 */

import { Result, ok, err, tryAsync, createErrorResult } from './result';

/**
 * Example: Session switching with proper error handling
 */
export async function switchToMainSession(
  sessionId: string
): Promise<Result<void, Error>> {
  return tryAsync(async () => {
    // Validate input
    if (!sessionId || sessionId.trim() === '') {
      throw createErrorResult.validation('Session ID cannot be empty').error;
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate potential network error
    if (sessionId === 'invalid-session') {
      throw createErrorResult.network('Session not found', 404).error;
    }

    // Success case - no return value needed for void
  });
}

/**
 * Example: Settings update with validation
 */
export async function updateUserSettings(
  settings: Record<string, unknown>
): Promise<Result<void, Error>> {
  return tryAsync(async () => {
    // Validate settings
    if (!settings || Object.keys(settings).length === 0) {
      throw createErrorResult.validation('Settings cannot be empty').error;
    }

    // Simulate validation of specific fields
    if (
      settings.theme &&
      !['light', 'dark', 'system'].includes(settings.theme as string)
    ) {
      throw createErrorResult.validation('Invalid theme value', 'theme').error;
    }

    // Simulate storage operation that might fail
    const storageSuccess = Math.random() > 0.1; // 90% success rate
    if (!storageSuccess) {
      throw createErrorResult.storage('Failed to save settings', 'update')
        .error;
    }

    // Success case
  });
}

/**
 * Example: Data fetching with error handling
 */
export async function fetchUserData(
  userId: string
): Promise<Result<{ name: string; email: string }, Error>> {
  return tryAsync(async () => {
    if (!userId) {
      throw createErrorResult.validation('User ID is required').error;
    }

    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Simulate different error scenarios
    if (userId === 'unauthorized') {
      throw createErrorResult.auth('Authentication required').error;
    }

    if (userId === 'not-found') {
      throw createErrorResult.network('User not found', 404).error;
    }

    // Success case
    return {
      name: 'John Doe',
      email: 'john@example.com',
    };
  });
}

/**
 * Helper to handle Result in store actions
 */
export function handleStoreResult<T>(
  result: Result<T, Error>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    setError?: (error: string | null) => void;
    setLoading?: (loading: boolean) => void;
  }
) {
  const { onSuccess, onError, setError, setLoading } = options;

  if (result.success) {
    setError?.(null);
    onSuccess?.(result.data);
  } else {
    const errorMessage = result.error.message || 'An unexpected error occurred';
    setError?.(errorMessage);
    onError?.(result.error);
  }

  setLoading?.(false);
}

/**
 * Store action wrapper that automatically handles loading and error states
 */
export function createStoreAction<T, Args extends unknown[]>(
  action: (...args: Args) => Promise<Result<T, Error>>,
  handlers: {
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  return async (...args: Args): Promise<T | null> => {
    const { setLoading, setError, onSuccess, onError } = handlers;

    setLoading(true);
    setError(null);

    try {
      const result = await action(...args);

      handleStoreResult(result, {
        onSuccess,
        onError,
        setError,
        setLoading,
      });

      return result.success ? result.data : null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      setLoading(false);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  };
}
