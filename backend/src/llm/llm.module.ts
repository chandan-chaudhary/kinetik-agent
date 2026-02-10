import { Module, forwardRef } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LanggraphService } from './langgraph/langgraph.service';
import { NodesModule } from 'src/nodes/nodes.module';
import { TelegramService } from '@/telegram-bot/telegram-bot.service';

@Module({
  providers: [LlmService, LanggraphService, TelegramService],
  imports: [forwardRef(() => NodesModule)],
  exports: [LlmService, LanggraphService, TelegramService],
})
export class LlmModule {}
