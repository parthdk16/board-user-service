// enhanced-logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MongoDBLoggerService } from '../../logs/service/mongodb-logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EnhancedLoggingInterceptor implements NestInterceptor {
  constructor(private readonly mongoLogger: MongoDBLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const correlationId = request.headers['x-correlation-id'] || uuidv4();
    const startTime = Date.now();

    // Extract request information
    const logContext = {
      method: request.method,
      url: request.url,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers['user-agent'],
      userId: request.user?.id || request.userId,
      sessionId: request.sessionID,
      correlationId,
      queryParams: request.query,
      routeParams: request.params,
      headers: this.filterHeaders(request.headers),
      requestBody: this.sanitizeRequestBody(request.body),
    };

    // Add correlation ID to response headers
    response.setHeader('X-Correlation-ID', correlationId);

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.mongoLogger.logHttpRequest({
          ...logContext,
          statusCode,
          responseTime,
        });
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? (error as any).message
            : String(error);
        this.mongoLogger.errorWithContext(
          `HTTP Error: ${errorMessage}`,
          error && typeof error === 'object' && 'stack' in error
            ? (error as any).stack
            : undefined,
          'HTTP',
          {
            ...logContext,
            statusCode,
            responseTime,
          },
        );

        throw error;
      }),
    );
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      (request.connection.socket
        ? request.connection.socket.remoteAddress
        : null) ||
      request.ip ||
      'unknown'
    );
  }

  private filterHeaders(headers: any): any {
    const filtered = { ...headers };

    // Remove sensitive headers
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'password',
    ];

    sensitiveHeaders.forEach((header) => {
      if (filtered[header]) {
        filtered[header] = '[FILTERED]';
      }
    });

    return filtered;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[FILTERED]';
      }
    });

    return sanitized;
  }
}
