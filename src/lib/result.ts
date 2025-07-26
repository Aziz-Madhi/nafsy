/**
 * Result Type Pattern for Consistent Error Handling
 * Provides a type-safe way to handle operations that may fail
 */

/**
 * Result union type for operations that can succeed or fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create an error result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Check if result is successful
 */
export function isOk<T, E>(
  result: Result<T, E>
): result is { success: true; data: T } {
  return result.success;
}

/**
 * Check if result is an error
 */
export function isErr<T, E>(
  result: Result<T, E>
): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Map a successful result to a new value
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * Chain operations that return Results
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.data);
  }
  return result;
}

/**
 * Map an error result to a new error
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Get the data from a result or return a default value
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.data : defaultValue;
}

/**
 * Get the data from a result or throw the error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.data;
  }
  throw result.error;
}

/**
 * Wrap a function that might throw into a Result
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Wrap an async function that might throw into a Result
 */
export async function tryAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Combine multiple Results into a single Result containing an array
 * If any Result is an error, returns the first error
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.data);
  }

  return ok(values);
}

/**
 * Match on a Result and handle both success and error cases
 */
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: {
    ok: (data: T) => U;
    err: (error: E) => U;
  }
): U {
  if (isOk(result)) {
    return handlers.ok(result.data);
  }
  return handlers.err(result.error);
}

/**
 * Application-specific error types
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public operation?: string
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Helper to create typed error results for common scenarios
 */
export const createErrorResult = {
  validation: (message: string, field?: string) =>
    err(new ValidationError(message, field)),

  network: (message: string, status?: number) =>
    err(new NetworkError(message, status)),

  auth: (message: string) => err(new AuthError(message)),

  storage: (message: string, operation?: string) =>
    err(new StorageError(message, operation)),

  generic: (message: string) => err(new Error(message)),
};
