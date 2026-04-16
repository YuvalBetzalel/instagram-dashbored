import {
  Controller, Get, Post, Delete, Patch,
  Param, Query, Body, UploadedFile, UseInterceptors, HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
}
