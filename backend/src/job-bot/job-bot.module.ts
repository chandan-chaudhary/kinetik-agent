import { Module } from '@nestjs/common';
import { JobBotService } from './job-bot.service';
import { JobBotController } from './job-bot.controller';
import { LlmModule } from '@/llm/llm.module';
import { PdfServiceService } from './pdf-service/pdf-service.service';

@Module({
  imports: [LlmModule],
  controllers: [JobBotController],
  providers: [JobBotService, PdfServiceService],
})
export class JobBotModule {}
