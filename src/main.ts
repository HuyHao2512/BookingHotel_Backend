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
  app.enableCors({
    origin: 'http://localhost:5173', // Cho phép frontend gọi API
    credentials: true, // Nếu cần gửi cookie hoặc xác thực
  });

  app.use(cookieParser());
  const port = 3000; // Sử dụng biến môi trường PORT, mặc định là 3000
  await app.listen(port);
  app.useGlobalPipes(new ValidationPipe());
}
bootstrap();
