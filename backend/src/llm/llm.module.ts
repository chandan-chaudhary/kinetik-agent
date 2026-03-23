import { Module, forwardRef } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LanggraphService } from '@/langgraph/langgraph.service';
import { DatabaseNodesService } from '@/chat-database/databaseNodes.service';
import { TelegramService } from '@/telegram-bot/telegram-bot.service';
import { NodesModule } from '@/nodes/nodes.module';
import { CredentailsModule } from '@/credentails/credentails.module';

@Module({
  imports: [forwardRef(() => NodesModule), CredentailsModule],
  providers: [
    LlmService,
    LanggraphService,
    DatabaseNodesService,
    TelegramService,
  ],
  exports: [
    LlmService,
    LanggraphService,
    DatabaseNodesService,
    TelegramService,
  ],
})
export class LlmModule {}
