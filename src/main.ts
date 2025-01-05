import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { UnHandledExceptions } from './filters/unhandeldErrors.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new UnHandledExceptions());
  await app.listen(3000);
}
bootstrap();
