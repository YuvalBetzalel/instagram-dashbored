import { Module } from '@nestjs/common';
import { MediaModule } from './media/media.module';
import { AgentsModule } from './agents/agents.module';
import { InstagramModule } from './instagram/instagram.module';

@Module({
  imports: [MediaModule, AgentsModule, InstagramModule],
})
export class AppModule {}
