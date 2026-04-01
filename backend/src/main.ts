import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common/services/logger.service';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { monitoringService } from './common/monitoring';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestIdHeader = req.headers['x-request-id'];
    const requestId = Array.isArray(requestIdHeader)
      ? requestIdHeader[0]
      : requestIdHeader || randomUUID();

    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    const startedAt = Date.now();
    res.on('finish', () => {
      monitoringService.captureRequest({
        event: 'http_request',
        level: 'info',
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    });

    next();
  });
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Cookie'],
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors) => {
        const details = validationErrors.map((error) => ({
          field: error.property,
          constraints: error.constraints,
        }));

        return new BadRequestException({
          message: 'Validation failed',
          details,
        });
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.listen(process.env.PORT || 3001, '0.0.0.0');
}

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  monitoringService.captureException(reason, {
    event: 'unhandled_rejection',
    level: 'error',
  });
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception:', error);
  monitoringService.captureException(error, {
    event: 'uncaught_exception',
    level: 'error',
  });
  // Don't exit the process, just log the error
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
void bootstrap();
