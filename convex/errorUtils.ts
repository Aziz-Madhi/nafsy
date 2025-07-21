import { QueryCtx, MutationCtx } from './_generated/server';

/**
 * Standard error types for the application
 */
export enum ErrorType {
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Creates authentication error
 */
export function createAuthError(
  message: string = 'Authentication required'
): AppError {
  return new AppError(ErrorType.AUTHENTICATION_REQUIRED, message, 401);
}

/**
 * Creates authorization error
 */
export function createAuthzError(message: string = 'Access denied'): AppError {
  return new AppError(ErrorType.AUTHORIZATION_DENIED, message, 403);
}

/**
 * Creates validation error
 */
export function createValidationError(
  message: string,
  details?: Record<string, any>
): AppError {
  return new AppError(ErrorType.VALIDATION_FAILED, message, 400, details);
}

/**
 * Creates not found error
 */
export function createNotFoundError(resource: string, id?: string): AppError {
  const message = id
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  return new AppError(ErrorType.NOT_FOUND, message, 404);
}

/**
 * Wraps async function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Log error for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.error('Function error:', error);
      }

      // Re-throw AppErrors as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Convert unknown errors to internal errors
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      throw new AppError(ErrorType.INTERNAL_ERROR, message, 500);
    }
  };
}

/**
 * Validates that a record exists, throws NotFoundError if not
 */
export function assertExists<T>(
  record: T | null | undefined,
  resourceName: string,
  id?: string
): asserts record is T {
  if (!record) {
    throw createNotFoundError(resourceName, id);
  }
}

/**
 * Validates input parameters
 */
export function validateInput(
  condition: boolean,
  message: string,
  details?: Record<string, any>
): void {
  if (!condition) {
    throw createValidationError(message, details);
  }
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute
): void {
  const now = Date.now();

  // Clean up expired entries when rate limit is checked
  cleanupRateLimit();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return;
  }

  if (entry.count >= limit) {
    throw new AppError(
      ErrorType.RATE_LIMITED,
      'Rate limit exceeded. Please try again later.',
      429,
      { limit, windowMs, resetTime: entry.resetTime }
    );
  }

  entry.count++;
}

/**
 * Cleans up old rate limit entries
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Note: Automatic cleanup removed due to Convex constraints
// Rate limit entries will be cleaned up manually when accessed
