import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ChatDatabaseService } from './chat-database.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('chat-database')
export class ChatDatabaseController {
  constructor(private readonly chatDatabaseService: ChatDatabaseService) {}

  @Post('query-dbgraph')
  async queryDBgraph(
    @Body()
    body: {
      prompt: string;
      llmProvider?: string;
      credentialId?: string;
      model?: string;
      apiKey?: string;
      databaseUrl?: string;
      dbType?: string;
    },
  ): Promise<any> {
    const { prompt, llmProvider, credentialId, databaseUrl, dbType } = body;
    const response = await this.chatDatabaseService.queryDBgraph(prompt, {
      llmProvider,
      credentialId,
      // model,
      // apiKey,
      databaseUrl,
      dbType,
    });
    console.log(response);
    return response;
  }

  @Post('approve')
  async approve(
    @Body() body: { threadId: string; approved: boolean; feedback?: string },
  ): Promise<any> {
    const { threadId, approved, feedback } = body;
    return this.chatDatabaseService.resumeWithApproval(
      threadId,
      approved,
      feedback,
    );
  }
}
