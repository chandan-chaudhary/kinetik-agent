import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export const ERROR_CODE = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

export interface AppErrorOptions {
  code: ErrorCode;
  httpStatus: HttpStatus;
  details?: unknown;
  isOperational?: boolean;
  exposeMessage?: boolean;
  cause?: unknown;
}

export interface CustomErrorOptions {
  fallbackCode?: ErrorCode;
  fallbackStatus?: HttpStatus;
  fallbackMessage?: string;
  details?: unknown;
  preserveHttpException?: boolean;
  preservePrismaError?: boolean;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: HttpStatus;
  readonly details?: unknown;
  readonly isOperational: boolean;
  readonly exposeMessage: boolean;
  readonly cause?: unknown;

  constructor(message: string, options: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    this.exposeMessage = options.exposeMessage ?? true;
    this.cause = options.cause;
  }
}

function mapHttpStatusToCode(status: HttpStatus): ErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ERROR_CODE.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
      return ERROR_CODE.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ERROR_CODE.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ERROR_CODE.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ERROR_CODE.CONFLICT;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ERROR_CODE.TOO_MANY_REQUESTS;
    case HttpStatus.SERVICE_UNAVAILABLE:
      return ERROR_CODE.SERVICE_UNAVAILABLE;
    case HttpStatus.INTERNAL_SERVER_ERROR:
      return ERROR_CODE.INTERNAL_ERROR;
    default:
      return ERROR_CODE.UNKNOWN_ERROR;
  }
}

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case 'P2002':
      return new AppError('Resource already exists', {
        code: ERROR_CODE.CONFLICT,
        httpStatus: HttpStatus.CONFLICT,
        details: {
          target: error.meta?.target,
        },
      });
    case 'P2025':
      return new AppError('Resource not found', {
        code: ERROR_CODE.NOT_FOUND,
        httpStatus: HttpStatus.NOT_FOUND,
      });
    default:
      return new AppError('Database operation failed', {
        code: ERROR_CODE.INTERNAL_ERROR,
        httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        exposeMessage: false,
        cause: error,
      });
  }
}

export function customError(
  error: unknown,
  options: CustomErrorOptions = {},
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (options.preservePrismaError !== false) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return mapPrismaError(error);
    }
  }

  if (options.preserveHttpException !== false) {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      const responseMessage =
        typeof response === 'object' && response && 'message' in response
          ? response.message
          : undefined;

      return new AppError(
        typeof responseMessage === 'string'
          ? responseMessage
          : error.message || 'Request failed',
        {
          code: mapHttpStatusToCode(status),
          httpStatus: status,
          details:
            typeof responseMessage !== 'string' && responseMessage
              ? responseMessage
              : options.details,
          cause: error,
        },
      );
    }
  }

  const fallbackStatus =
    options.fallbackStatus ?? HttpStatus.INTERNAL_SERVER_ERROR;
  const fallbackCode =
    options.fallbackCode ?? mapHttpStatusToCode(fallbackStatus);

  return new AppError(options.fallbackMessage ?? 'Internal server error', {
    code: fallbackCode,
    httpStatus: fallbackStatus,
    details: options.details,
    exposeMessage: false,
    cause: error,
  });
}

export function createError(
  message: string,
  options: Omit<AppErrorOptions, 'cause' | 'code'> & {
    code?: ErrorCode;
  },
): AppError {
  return new AppError(message, {
    ...options,
    code: options.code ?? mapHttpStatusToCode(options.httpStatus),
  });
}

export interface ErrorResponseBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
    requestId?: string;
  };
}
