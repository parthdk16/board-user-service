// enhanced-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoDBLoggerService } from '../../logs/service/mongodb-logger.service';

@Catch()
export class EnhancedExceptionFilter implements ExceptionFilter {
  constructor(private readonly mongoLogger: MongoDBLoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception.message || 'Internal server error';

    const logContext = {
      method: request.method,
      url: request.url,
      statusCode: status,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      userId: (request as any).user?.id || (request as any).userId,
      sessionId: (request as any).sessionID,
      correlationId: request.headers['x-correlation-id'] as string,
      queryParams: request.query,
      routeParams: request.params,
      headers: this.filterHeaders(request.headers),
      requestBody: request.body,
    };

    this.mongoLogger.errorWithContext(
      `Unhandled Exception: ${message}`,
      exception.stack,
      'Exception',
      logContext,
    );

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      correlationId: logContext.correlationId,
    };

    response.status(status).json(errorResponse);
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private filterHeaders(headers: any): any {
    const filtered = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    sensitiveHeaders.forEach((header) => {
      if (filtered[header]) {
        filtered[header] = '[FILTERED]';
      }
    });

    return filtered;
  }
}
