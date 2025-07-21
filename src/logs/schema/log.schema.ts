// log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;

@Schema({ timestamps: true })
export class Log {
  @Prop({ required: true })
  level: string; // 'error', 'warn', 'log', 'debug', 'verbose'

  @Prop({ required: true })
  message: string;

  @Prop()
  context?: string;

  @Prop()
  method?: string; // HTTP method

  @Prop()
  url?: string; // Request URL

  @Prop()
  statusCode?: number; // HTTP status code

  @Prop()
  responseTime?: number; // Response time in ms

  @Prop()
  ipAddress?: string; // Client IP address

  @Prop()
  userAgent?: string; // User agent string

  @Prop()
  userId?: string; // User ID if authenticated

  @Prop({ type: Object })
  requestBody?: any; // Request body

  @Prop({ type: Object })
  queryParams?: any; // Query parameters

  @Prop({ type: Object })
  routeParams?: any; // Route parameters

  @Prop({ type: Object })
  headers?: any; // Request headers

  @Prop()
  error?: string; // Error message

  @Prop()
  stack?: string; // Error stack trace

  @Prop({ type: Object })
  metadata?: any; // Additional metadata

  @Prop()
  sessionId?: string; // Session ID

  @Prop()
  correlationId?: string; // Request correlation ID

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const LogSchema = SchemaFactory.createForClass(Log);

// Index for better query performance
LogSchema.index({ timestamp: -1 });
LogSchema.index({ level: 1 });
LogSchema.index({ ipAddress: 1 });
LogSchema.index({ userId: 1 });
LogSchema.index({ correlationId: 1 });
