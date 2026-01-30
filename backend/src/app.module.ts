import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LlmService } from './llm/llm.service';
import { ConfigModule } from '@nestjs/config';
import { NodesService } from './nodes/nodes.service';
import { DatabaseModule } from './database/database.module';
import { NodesModule } from './nodes/nodes.module';
import { WorkflowModule } from './workflow/workflow.module';
import llmConfig from './config/llm.config';

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
  ],
  controllers: [AppController],
  providers: [AppService, LlmService, NodesService],
})
export class AppModule {}
