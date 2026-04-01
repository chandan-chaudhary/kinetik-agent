import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError, customError, type ErrorResponseBody } from './customError';
import { monitoringService } from './monitoring';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const normalized = customError(exception, {
      fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      fallbackMessage: 'Something went wrong',
    });

    this.logException(normalized, request);

    const shouldExposeMessage =
      normalized.exposeMessage || process.env.NODE_ENV !== 'production';

    const body: ErrorResponseBody = {
      success: false,
      error: {
        code: normalized.code,
        message: shouldExposeMessage
          ? normalized.message
          : 'Internal server error',
        details: normalized.details,
        timestamp: new Date().toISOString(),
        path: request.originalUrl,
        requestId: this.getRequestId(request),
      },
    };

    response.status(normalized.httpStatus).json(body);
  }

  private getRequestId(request: Request): string | undefined {
    const requestId = request.headers['x-request-id'];
    if (!requestId) return undefined;
    return Array.isArray(requestId) ? requestId[0] : requestId;
  }

  private logException(error: AppError, request: Request): void {
    const payload = {
      code: error.code,
      status: error.httpStatus,
      method: request.method,
      path: request.originalUrl,
      requestId: this.getRequestId(request),
      details: error.details,
      cause:
        error.cause instanceof Error
          ? {
              name: error.cause.name,
              message: error.cause.message,
              stack: error.cause.stack,
            }
          : error.cause,
    };

    this.logger.error(error.message, JSON.stringify(payload));
    monitoringService.captureException(error.cause ?? error, {
      event: 'http_exception',
      level: 'error',
      requestId: this.getRequestId(request),
      code: error.code,
      status: error.httpStatus,
      method: request.method,
      path: request.originalUrl,
      details: error.details,
    });
  }
}
