import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async findAll(tags?: string) {
    const all = await this.prisma.media.findMany({ orderBy: { createdAt: 'desc' } });
    if (!tags) return all;
    const filterTags = tags.split(',').map((t) => t.trim().toLowerCase());
    return all.filter((m) => {
      const mediaTags: string[] = (() => { try { return JSON.parse(m.tags || '[]'); } catch { return []; } })();
      return filterTags.some((t) => mediaTags.map((mt) => mt.toLowerCase()).includes(t));
    });
  }

  async findOne(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async create(file: Express.Multer.File, tags?: string) {
    const tagArray = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    return this.prisma.media.create({
      data: {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.filename,
        tags: JSON.stringify(tagArray),
      },
    });
  }

  async updateTags(id: string, tags: string) {
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    return this.prisma.media.update({
      where: { id },
      data: { tags: JSON.stringify(tagArray) },
    });
  }

  async delete(id: string) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    const fullPath = join('uploads', media.path);
    if (existsSync(fullPath)) {
      try { unlinkSync(fullPath); } catch {}
    }
    return this.prisma.media.delete({ where: { id } });
  }
}
