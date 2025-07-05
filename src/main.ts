import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MongoDBLoggerService } from './logs/service/mongodb-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const mongoLogger = app.get(MongoDBLoggerService);

  app.useLogger(mongoLogger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API Documentation - User Service')
    .setDescription('Board Result Publication System - User Service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3001);

  // console.log(`User service is running at: ${process.env.USER_SERVICE_URL}`);
  // console.log(
  //   `API Documentation available at: ${process.env.USER_SERVICE_URL}/api-docs`,
  // );

  // Log startup with context
  mongoLogger.logWithContext(
    `🚀 Application is running on: http://localhost:${process.env.PORT}`,
    'Bootstrap',
    {
      metadata: {
        port: process.env.PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
      },
    },
  );

  mongoLogger.logWithContext(
    `📚 Swagger documentation available at: http://localhost:${process.env.PORT}/api-docs`,
    'Bootstrap',
    {
      metadata: { swaggerUrl: `http://localhost:${process.env.PORT}/api-docs` },
    },
  );
}
bootstrap();
