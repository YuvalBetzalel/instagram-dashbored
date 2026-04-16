import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MediaModule } from './media/media.module';
import { AgentsModule } from './agents/agents.module';
import { InstagramModule } from './instagram/instagram.module';
import { SpaMiddleware } from './spa.middleware';

@Module({
  imports: [MediaModule, AgentsModule, InstagramModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SpaMiddleware).forRoutes('*');
  }
}
