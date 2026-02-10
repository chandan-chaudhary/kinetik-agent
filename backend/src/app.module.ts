import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseNodesService } from './nodes/databaseNodes.service';
import { DatabaseModule } from './database/database.module';
import { NodesModule } from './nodes/nodes.module';
import { WorkflowModule } from './workflow/workflow.module';
import { JobBotModule } from './job-bot/job-bot.module';
import llmConfig from './config/llm.config';
import { LlmModule } from './llm/llm.module';
import { LanggraphController } from './llm/langgraph/langgraph.controller';
import { TelegramService } from './telegram-bot/telegram-bot.service';
import marketApiConfig from './config/market-api.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [llmConfig, marketApiConfig],
    }),
    DatabaseModule,
    NodesModule,
    LlmModule,
    WorkflowModule,
    JobBotModule,
  ],
  controllers: [AppController, LanggraphController],
  providers: [AppService, DatabaseNodesService, TelegramService],
})
export class AppModule {}
