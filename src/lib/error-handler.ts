/**
 * Security: Centralized Error Handling
 *
 * Provides consistent error responses across the application.
 * Prevents information disclosure through error messages.
 *
 * Last Updated: 2026-05-12
 */

import { toast } from "sonner";

// ─── Error Types ─────────────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error classes
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied") {
    super(message, "AUTHORIZATION_ERROR", 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, "RATE_LIMIT_ERROR", 429);
    this.name = "RateLimitError";
  }
}

export class ServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, "SERVER_ERROR", 500, false);
    this.name = "ServerError";
  }
}

// ─── Error Response ─────────────────────────────────────────────────

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
  requestId?: string;
}

/**
 * Generate a secure error response
 * Never expose internal details like stack traces to clients
 */
export function createErrorResponse(error: Error | AppError, requestId?: string): ErrorResponse {
  // For operational errors, show the message
  // For programming errors, show a generic message
  const isOperational = error instanceof AppError ? error.isOperational : false;

  const response: ErrorResponse = {
    error: {
      code: error instanceof AppError ? error.code : "INTERNAL_ERROR",
      message: isOperational ? error.message : "An unexpected error occurred",
      statusCode: error instanceof AppError ? error.statusCode : 500,
    },
  };

  if (requestId) {
    response.requestId = requestId;
  }

  return response;
}

/**
 * Log error securely (for server-side logging)
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  const isOperational = error instanceof AppError ? error.isOperational : false;

  // Always log to console
  console.error("[Error]", {
    name: error.name,
    message: error.message,
    stack: isOperational ? undefined : error.stack, // Only log stack for non-operational errors
    code: error instanceof AppError ? error.code : undefined,
    context,
    timestamp: new Date().toISOString(),
  });

  // TODO: In production, send to error tracking service (e.g., Sentry)
  // if (!isOperational) {
  //   Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Handle error and return appropriate response
 */
export function handleError(
  error: unknown,
  context?: Record<string, unknown>,
): {
  response: ErrorResponse;
  statusCode: number;
} {
  // Handle AppError instances
  if (error instanceof AppError) {
    logError(error, context);
    return {
      response: createErrorResponse(error),
      statusCode: error.statusCode,
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    logError(error, context);
    return {
      response: createErrorResponse(
        new ServerError("An unexpected error occurred"),
        context?.requestId as string | undefined,
      ),
      statusCode: 500,
    };
  }

  // Handle unknown errors
  console.error("[Unknown Error]", error, context);
  return {
    response: {
      error: {
        code: "UNKNOWN_ERROR",
        message: "An unexpected error occurred",
        statusCode: 500,
      },
    },
    statusCode: 500,
  };
}

// ─── Client-side Error Handling ────────────────────────────────────

/**
 * Show error toast to user
 */
export function showErrorToast(error: unknown): void {
  if (error instanceof AppError) {
    toast.error(error.message);
  } else if (error instanceof Error) {
    // Don't expose internal error messages to users
    toast.error("Terjadi kesalahan. Silakan coba lagi.");
  } else {
    toast.error("Terjadi kesalahan. Silakan coba lagi.");
  }
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Map common errors to user-friendly messages
    if (error.message.includes("fetch")) {
      return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
    }
    if (error.message.includes("timeout")) {
      return "Permintaan timeout. Silakan coba lagi.";
    }
    return "Terjadi kesalahan. Silakan coba lagi.";
  }

  return "Terjadi kesalahan. Silakan coba lagi.";
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === "TypeError" && error.message.includes("fetch");
  }
  return false;
}

/**
 * Check if error is an auth error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error instanceof AuthenticationError;
  }
  if (error instanceof Error) {
    return (
      error.message.includes("Unauthorized") ||
      error.message.includes("auth") ||
      error.message.includes("token")
    );
  }
  return false;
}
