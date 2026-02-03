import { Module } from '@nestjs/common';
import { JobBotService } from './job-bot.service';
import { JobBotController } from './job-bot.controller';
import { LlmModule } from '@/llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [JobBotController],
  providers: [JobBotService],
})
export class JobBotModule {}
