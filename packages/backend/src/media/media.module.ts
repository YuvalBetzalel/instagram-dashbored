import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma/prisma.service';

const uploadsDir = 'uploads';
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, unique + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ok = /image\/(jpeg|png|gif|webp)|video\/(mp4|quicktime|x-msvideo)/.test(file.mimetype);
        cb(null, ok);
      },
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, PrismaService],
})
export class MediaModule {}
