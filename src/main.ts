import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/exceptions/exceptions';

/**
 * whitelist: true => only allow the properties defined in the DTO but need defined decorator in DTO
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true, }));

  app.useGlobalFilters(new HttpExceptionFilter());

  // Kích hoạt CORS với cấu hình mặc định
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:3000'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Cho phép cookie và header xác thực
  });


  const port = configService.get<number>("PORT") ?? 5000;

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
