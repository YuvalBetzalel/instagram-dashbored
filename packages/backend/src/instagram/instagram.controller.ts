import { Controller, Get, Post, Delete, Param, Body, HttpCode } from '@nestjs/common';
import { InstagramService } from './instagram.service';

@Controller('instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get('insights')
  getInsights() {
    return this.instagramService.getInsights();
  }

  @Post('schedule')
  schedulePost(
    @Body() body: { caption: string; scheduledAt: string; scriptId?: string },
  ) {
    return this.instagramService.schedulePost(body.caption, body.scheduledAt, body.scriptId);
  }

  @Get('queue')
  getQueue() {
    return this.instagramService.getQueue();
  }

  @Post('publish/:id')
  publishPost(@Param('id') id: string) {
    return this.instagramService.publishPost(id);
  }

  @Delete('queue/:id')
  @HttpCode(204)
  deletePost(@Param('id') id: string) {
    return this.instagramService.deletePost(id);
  }
}
