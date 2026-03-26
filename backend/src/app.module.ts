import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { NodesModule } from './nodes/nodes.module';
import { WorkflowModule } from './workflow/workflow.module';
import { JobBotModule } from './job-bot/job-bot.module';
import llmConfig from './config/llm.config';
import { LlmModule } from './llm/llm.module';
import { LanggraphController } from './langgraph/langgraph.controller';
import { AuthModule } from './auth/auth.module';
import { ChatDatabaseModule } from './chat-database/chat-database.module';
import { CredentailsModule } from './credentails/credentails.module';
import { ChatSessionModule } from './chat-session/chat-session.module';
import marketApiConfig from './config/market-api.config';
import credentialsConfig from './config/credentials.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [llmConfig, marketApiConfig, credentialsConfig],
    }),
    DatabaseModule,
    NodesModule,
    LlmModule,
    WorkflowModule,
    JobBotModule,
    AuthModule,
    ChatDatabaseModule,
    CredentailsModule,
    ChatSessionModule,
  ],
  controllers: [AppController, LanggraphController],
  providers: [AppService],
})
export class AppModule {}
