import { Logger } from '@nestjs/common';

interface MonitoringEvent {
  event: string;
  level?: 'info' | 'warn' | 'error';
  message?: string;
  requestId?: string;
  [key: string]: unknown;
}

class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  captureRequest(event: MonitoringEvent): void {
    // Boilerplate: send request metrics to your monitoring provider.
    // Example integrations:
    // - Sentry: Sentry.addBreadcrumb({ category: 'http', level: 'info', data: event })
    // - Datadog: datadogLogs.logger.info('http_request', event)
    // - OpenTelemetry: span.setAttributes(event)
    this.logger.log(JSON.stringify({ ...event, type: 'request' }));
  }

  captureException(error: unknown, context: MonitoringEvent): void {
    // Boilerplate: send exceptions/errors to your monitoring provider.
    // Example integrations:
    // - Sentry: Sentry.captureException(error, { tags: { requestId: context.requestId }, extra: context })
    // - Datadog: datadogLogs.logger.error('backend_exception', { error, ...context })
    // - New Relic: newrelic.noticeError(error, context)
    const normalized =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : { raw: error };

    this.logger.error(
      JSON.stringify({
        ...context,
        type: 'exception',
        error: normalized,
      }),
    );
  }

  captureMessage(message: string, context: MonitoringEvent): void {
    this.logger.log(
      JSON.stringify({
        ...context,
        type: 'message',
        message,
      }),
    );
  }
}

export const monitoringService = new MonitoringService();
