import {
  Controller, Get, Post, Delete, Patch,
  Param, Query, Body, UploadedFile, UseInterceptors, HttpCode, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  findAll(@Query('tags') tags?: string) {
    return this.mediaService.findAll(tags);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('tags') tags?: string,
  ) {
    return this.mediaService.create(file, tags);
  }

  @Patch(':id/tags')
  updateTags(@Param('id') id: string, @Body('tags') tags: string) {
    return this.mediaService.updateTags(id, tags);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.mediaService.delete(id);
  }

  @Post(':id/process')
  async processVideo(
    @Param('id') id: string,
    @Body() opts: { text?: string; filter?: string; speed?: number },
    @Res() res: Response,
  ) {
    try {
      const outPath = await this.mediaService.processVideo(id, opts);
      res.download(outPath);
    } catch (e: any) {
      res.status(500).json({ error: e.message ?? 'Processing failed' });
    }
  }
}
