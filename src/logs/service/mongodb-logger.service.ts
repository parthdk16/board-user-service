// mongodb-logger.service.ts
import { Injectable, ConsoleLogger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from '../schema/log.schema';
import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  requestBody?: any;
  queryParams?: any;
  routeParams?: any;
  headers?: any;
  sessionId?: string;
  correlationId?: string;
  metadata?: any;
}

@Injectable()
export class MongoDBLoggerService extends ConsoleLogger {
  constructor(@InjectModel(Log.name) private logModel: Model<LogDocument>) {
    super('MongoDBLogger');
  }

  private async saveToMongoDB(
    level: string,
    message: string,
    context?: string,
    logContext?: LogContext,
    error?: string,
    stack?: string,
  ) {
    try {
      const logEntry = new this.logModel({
        level,
        message,
        context,
        error,
        stack,
        correlationId: logContext?.correlationId || uuidv4(),
        timestamp: new Date(),
        ...logContext,
      });

      await logEntry.save();
    } catch (err) {
      console.error('Failed to save log to MongoDB:', err);
    }
  }

  logWithContext(message: string, context?: string, logContext?: LogContext) {
    super.log(message, context);
    this.saveToMongoDB('log', message, context, logContext);
  }

  errorWithContext(
    message: string,
    stack?: string,
    context?: string,
    logContext?: LogContext,
  ) {
    super.error(message, stack, context);
    this.saveToMongoDB('error', message, context, logContext, message, stack);
  }

  warnWithContext(message: string, context?: string, logContext?: LogContext) {
    super.warn(message, context);
    this.saveToMongoDB('warn', message, context, logContext);
  }

  debugWithContext(message: string, context?: string, logContext?: LogContext) {
    super.debug(message, context);
    this.saveToMongoDB('debug', message, context, logContext);
  }

  verboseWithContext(
    message: string,
    context?: string,
    logContext?: LogContext,
  ) {
    super.verbose(message, context);
    this.saveToMongoDB('verbose', message, context, logContext);
  }

  // HTTP Request logging
  logHttpRequest(logContext: LogContext) {
    const message = `${logContext.method} ${logContext.url} - ${logContext.statusCode} - ${logContext.responseTime}ms`;
    this.logWithContext(message, 'HTTP', logContext);
  }

  // Query logs by various criteria
  async findLogs(filters: {
    level?: string;
    startDate?: Date;
    endDate?: Date;
    ipAddress?: string;
    userId?: string;
    correlationId?: string;
    limit?: number;
    skip?: number;
  }) {
    const query: any = {};

    if (filters.level) query.level = filters.level;
    if (filters.ipAddress) query.ipAddress = filters.ipAddress;
    if (filters.userId) query.userId = filters.userId;
    if (filters.correlationId) query.correlationId = filters.correlationId;

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    return this.logModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(filters.limit || 100)
      .skip(filters.skip || 0)
      .exec();
  }

  // Get log statistics
  async getLogStats(startDate?: Date, endDate?: Date) {
    const matchStage: any = {};
    if (startDate || endDate) {
      matchStage.timestamp = {};
      if (startDate) matchStage.timestamp.$gte = startDate;
      if (endDate) matchStage.timestamp.$lte = endDate;
    }

    return this.logModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }
}
