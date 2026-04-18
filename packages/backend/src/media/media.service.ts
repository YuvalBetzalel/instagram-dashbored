import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { unlinkSync, existsSync, mkdirSync } from 'fs';
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

  async processVideo(
    id: string,
    opts: { text?: string; filter?: string; speed?: number },
  ): Promise<string> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');

    const inputPath = join('uploads', media.path);
    if (!existsSync(inputPath)) throw new Error('Source file not found');

    const processedDir = join('uploads', 'processed');
    mkdirSync(processedDir, { recursive: true });
    const outFilename = `processed-${Date.now()}-${media.path}`;
    const outputPath = join(processedDir, outFilename);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffmpeg = require('fluent-ffmpeg');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    return new Promise((resolve, reject) => {
      let cmd = ffmpeg(inputPath).outputOptions([
        '-c:v libx264', '-preset fast', '-crf 23',
        '-c:a aac', '-b:a 128k',
        '-movflags +faststart',
      ]);

      if (opts.filter === 'vivid') cmd = cmd.videoFilters('eq=saturation=1.4:contrast=1.1:brightness=0.05');
      if (opts.filter === 'cinematic') cmd = cmd.videoFilters('eq=saturation=0.85:contrast=1.2,vignette');
      if (opts.filter === 'warm') cmd = cmd.videoFilters('colorchannelmixer=rr=1.1:gg=0.95:bb=0.85');

      if (opts.speed && opts.speed !== 1) {
        const v = Math.max(0.5, Math.min(2, opts.speed));
        const a = 1 / v;
        cmd = cmd.videoFilters(`setpts=${a}*PTS`).audioFilters(`atempo=${v}`);
      }

      if (opts.text) {
        const safe = opts.text.replace(/'/g, "\\'").replace(/:/g, '\\:');
        cmd = cmd.videoFilters(
          `drawtext=text='${safe}':fontsize=54:fontcolor=white:x=(w-text_w)/2:y=h-120:box=1:boxcolor=black@0.5:boxborderw=12`
        );
      }

      cmd.output(outputPath).on('end', () => resolve(outputPath)).on('error', reject).run();
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
