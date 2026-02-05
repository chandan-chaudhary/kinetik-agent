import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmService } from './llm/llm.service';
import { ConfigModule } from '@nestjs/config';
import { NodesService } from './nodes/nodes.service';
import { DatabaseModule } from './database/database.module';
import { NodesModule } from './nodes/nodes.module';
import { WorkflowModule } from './workflow/workflow.module';
import { JobBotModule } from './job-bot/job-bot.module';
import llmConfig from './config/llm.config';
import { LanggraphService } from './llm/langgraph/langgraph.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [llmConfig],
    }),
    DatabaseModule,
    NodesModule,
    WorkflowModule,
    JobBotModule,
  ],
  controllers: [AppController],
  providers: [AppService, LlmService, NodesService, LanggraphService],
})
export class AppModule {}
