import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/exceptions/exceptions';
import * as bodyParser from 'body-parser';
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
  // ✅ Increase request payload limits globally
  app.use(bodyParser.json({ limit: '50mb' })); // ✅ Increase JSON payload size to 50MB
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // ✅ Increase URL-encoded payload size

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>("PORT") ?? 5000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
