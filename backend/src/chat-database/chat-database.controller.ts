import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ChatDatabaseService } from './chat-database.service';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '@/types/auth.types';

@UseGuards(AuthGuard('jwt'))
@Controller('chat-database')
export class ChatDatabaseController {
  constructor(private readonly chatDatabaseService: ChatDatabaseService) {}

  // @Post('query-dbgraph')
  // async queryDBgraph(
  //   @Body()
  //   body: {
  //     prompt: string;
  //     llmProvider?: string;
  //     credentialId?: string;
  //     model?: string;
  //     apiKey?: string;
  //     databaseUrl?: string;
  //     dbType?: string;
  //   },
  // ): Promise<any> {
  //   const { prompt, llmProvider, credentialId, databaseUrl, dbType } = body;
  //   const response = await this.chatDatabaseService.queryDBgraph(prompt, {
  //     llmProvider,
  //     credentialId,
  //     // model,
  //     // apiKey,
  //     databaseUrl,
  //     dbType,
  //   });
  //   console.log(response);
  //   return response;
  // }

  @Post('query-dbgraph')
  async queryDBgraph(
    @Body()
    body: {
      prompt: string;
      sessionId: string; // NEW — required
      llmProvider?: string;
      credentialId?: string;
      model?: string;
      apiKey?: string;
      databaseUrl?: string;
      dbType?: string;
    },
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const {
      prompt,
      sessionId,
      llmProvider,
      credentialId,
      databaseUrl,
      dbType,
    } = body;
    return this.chatDatabaseService.queryDBgraph(prompt, {
      sessionId,
      userId: req.user!.userId,
      llmProvider,
      credentialId,
      databaseUrl,
      dbType,
    });
  }

  @Post('approve')
  async approve(
    @Body() body: { threadId: string; approved: boolean; feedback?: string },
    // @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const { threadId, approved, feedback } = body;
    return this.chatDatabaseService.resumeWithApproval(
      threadId,
      approved,
      feedback,
    );
  }
}
