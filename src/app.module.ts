import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { Log, LogSchema } from './logs/schema/log.schema';
import { MongoDBLoggerService } from './logs/service/mongodb-logger.service';
import { EnhancedLoggingInterceptor } from './common/intercepter/enhanced-logging.intercepter';
import { EnhancedExceptionFilter } from './common/filter/enhanced-exception.filter';
import { LogManagementController } from './logs/controller/log-management.controller';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/board_exam_users'),
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController, LogManagementController],
  providers: [
    AppService,
    MongoDBLoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: EnhancedLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: EnhancedExceptionFilter,
    },
  ],
  exports: [MongoDBLoggerService],
})
export class AppModule {}
