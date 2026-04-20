import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';
config({ path: resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: '*', credentials: false });

  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const uploadsDir = join(__dirname, '..', 'uploads');
  const processedDir = join(uploadsDir, 'processed');
  mkdirSync(uploadsDir, { recursive: true });
  mkdirSync(processedDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/api/uploads' });
  app.useStaticAssets(processedDir, { prefix: '/api/processed' });

  // Serve the built React frontend (only in production where dist/ exists)
  const frontendDist = join(__dirname, '..', '..', 'frontend', 'dist');
  if (existsSync(frontendDist)) {
    app.useStaticAssets(frontendDist, { prefix: '/' });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running → http://localhost:${port}`);
}

bootstrap();
