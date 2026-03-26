import { Module } from '@nestjs/common';
import { ChatDatabaseService } from './chat-database.service';
import { ChatDatabaseController } from './chat-database.controller';
import { LlmModule } from '@/llm/llm.module';
import { ChatSessionService } from '@/chat-session/chat-session.service';

@Module({
  imports: [LlmModule],
  controllers: [ChatDatabaseController],
  providers: [ChatDatabaseService, ChatSessionService],
  exports: [ChatDatabaseService],
})
export class ChatDatabaseModule {}
