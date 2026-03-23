import { Module } from '@nestjs/common';
import { ChatDatabaseService } from './chat-database.service';
import { ChatDatabaseController } from './chat-database.controller';
import { LlmModule } from '@/llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [ChatDatabaseController],
  providers: [ChatDatabaseService],
  exports: [ChatDatabaseService],
})
export class ChatDatabaseModule {}
