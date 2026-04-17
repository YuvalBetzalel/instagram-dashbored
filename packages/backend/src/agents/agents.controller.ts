import { Controller, Post, Body } from '@nestjs/common';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('script')
  generateScript(
    @Body() body: { mediaIds?: string[]; contentType?: string; niche?: string },
  ) {
    return this.agentsService.generateScript(
      body.mediaIds ?? [],
      body.contentType ?? 'Reel',
      body.niche ?? 'ספורטוויר נשים',
    );
  }

  @Post('capcut')
  generateCapCut(@Body() body: { script?: string; style?: string }) {
    return this.agentsService.generateCapCut(
      body.script ?? '',
      body.style ?? 'Dynamic',
    );
  }

  @Post('hashtags')
  generateHashtags(@Body() body: { script?: string }) {
    return this.agentsService.generateHashtags(body.script ?? '');
  }

  @Post('save-script')
  saveScript(
    @Body() body: { content: string; contentType?: string; niche?: string; mediaId?: string },
  ) {
    return this.agentsService.saveScript(
      body.content,
      body.contentType ?? 'Reel',
      body.niche ?? 'ספורטוויר נשים',
      body.mediaId,
    );
  }

  @Post('carousel')
  generateCarousel(@Body() body: { script?: string; brandName?: string; niche?: string }) {
    return this.agentsService.generateCarousel(
      body.script ?? '',
      body.brandName ?? 'ActiveWear IL',
      body.niche ?? 'ספורטוויר נשים',
    );
  }
}
