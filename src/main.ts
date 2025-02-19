import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';
import cookieParser from 'cookie-parser';
// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const port = process.env.PORT || 3000; // Sử dụng biến môi trường PORT, mặc định là 3000
  await app.listen(port);
  app.useGlobalPipes(new ValidationPipe());
}
bootstrap();
