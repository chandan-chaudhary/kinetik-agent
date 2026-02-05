import { Prisma } from '@prisma/client';

// ═══════════════════════════════════════════════════════════════════════════
// ERROR MESSAGE EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Safely extracts error message from any error type
 * @param error - Any error object
 * @returns String representation of the error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    // Try common error properties
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    // Fallback to JSON stringification
    try {
      return JSON.stringify(error);
    } catch {
      return JSON.stringify(error);
    }
  }

  return JSON.stringify(error);
}

/**
 * Extracts full error details including stack trace if available
 * @param error - Any error object
 * @returns Detailed error information
 */
export function getErrorDetails(error: unknown): {
  message: string;
  stack?: string;
  name?: string;
  code?: string | number;
} {
  const message = getErrorMessage(error);

  if (error instanceof Error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error.code as string | number)
        : undefined;

    return {
      message,
      stack: error.stack,
      name: error.name,
      code,
    };
  }

  return { message };
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log error with consistent formatting
 * @param context - Context or prefix for the error
 * @param error - The error to log
 * @param level - Log level (error, warn, log)
 */
export function logError(
  context: string,
  error: unknown,
  level: 'error' | 'warn' | 'log' = 'error',
): void {
  const message = getErrorMessage(error);
  const logFn = console[level];

  logFn(`${context}: ${message}`);

  // Log stack trace for Error instances in development
  if (
    error instanceof Error &&
    error.stack &&
    process.env.NODE_ENV !== 'production'
  ) {
    console.debug('Stack trace:', error.stack);
  }
}

/**
 * Log retry attempt errors with attempt count
 * @param attempt - Current attempt number
 * @param maxAttempts - Maximum number of attempts
 * @param error - The error that occurred
 * @param context - Optional context message
 */
export function logRetryError(
  attempt: number,
  maxAttempts: number,
  error: unknown,
  context?: string,
): void {
  const message = getErrorMessage(error);
  const prefix = context ? `${context} - ` : '';
  console.warn(
    `   ⚠️  ${prefix}Attempt ${attempt}/${maxAttempts} failed: ${message}`,
  );
}

/**
 * Log final retry failure
 * @param maxAttempts - Maximum number of attempts that were made
 * @param error - The final error
 * @param context - Optional context message
 */
export function logRetryFailure(
  maxAttempts: number,
  error: unknown,
  context?: string,
): void {
  const message = getErrorMessage(error);
  const prefix = context ? `${context} - ` : '';
  console.error(
    `   ❌ ${prefix}All ${maxAttempts} attempts failed: ${message}`,
  );
}

/**
 * Log warning with error details
 * @param context - Warning context
 * @param error - The error to warn about
 */
export function logWarning(context: string, error: unknown): void {
  logError(context, error, 'warn');
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR WRAPPING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wraps an error with additional context
 * @param error - Original error
 * @param context - Additional context to add
 * @returns New error with context
 */
export function wrapError(error: unknown, context: string): Error {
  const message = getErrorMessage(error);
  const wrappedError = new Error(`${context}: ${message}`);

  // Preserve original stack if available
  if (error instanceof Error && error.stack) {
    wrappedError.stack = `${wrappedError.stack}\nCaused by: ${error.stack}`;
  }

  return wrappedError;
}

// ═══════════════════════════════════════════════════════════════════════════
// ASYNC ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Safely executes an async function with error handling
 * @param fn - Async function to execute
 * @param context - Context for error logging
 * @returns Result or null if error occurred
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: string,
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    logError(context, error);
    return null;
  }
}

/**
 * Executes an async function with retries
 * @param fn - Async function to execute
 * @param maxRetries - Maximum number of retries
 * @param context - Context for error logging
 * @param delayMs - Delay between retries in milliseconds
 * @returns Result or throws after all retries fail
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  context: string = 'Operation',
  delayMs: number = 1000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        logRetryFailure(maxRetries, error, context);
        throw wrapError(
          error,
          `${context} failed after ${maxRetries} attempts`,
        );
      }

      logRetryError(attempt, maxRetries, error, context);

      // Wait before retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw new Error('Unreachable code');
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for timeout errors
 */
export class TimeoutError extends Error {
  constructor(
    message: string,
    public timeoutMs?: number,
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Custom error class for retry exhaustion
 */
export class RetryExhaustedError extends Error {
  constructor(
    message: string,
    public attempts: number,
    public lastError: unknown,
  ) {
    super(message);
    this.name = 'RetryExhaustedError';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP ERROR HANDLER (Original functionality)
// ═══════════════════════════════════════════════════════════════════════════

export function handleError(error: unknown) {
  // log error for server-side debugging
  try {
    console.error('Handled error:', error);
  } catch {
    // Ignore logging errors
  }

  // Prisma known request errors (e.g. record not found)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // other known request errors -> Bad Request
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validation error thrown by Prisma client
  if (error instanceof Prisma.PrismaClientValidationError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Generic error instance
  if (error instanceof Error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Fallback
  return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
