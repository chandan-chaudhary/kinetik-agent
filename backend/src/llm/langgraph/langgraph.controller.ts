import { Body, Controller, Post, Req } from '@nestjs/common';
import { LlmService } from '../llm.service';

@Controller('langgraph')
export class LanggraphController {
  constructor(private readonly llmService: LlmService) {}

  @Post('query-dbgraph')
  async queryDBgraph(
    @Req() request: Request,
    @Body() body: { prompt: string },
  ): Promise<any> {
    const prompt = body.prompt;
    const response = await this.llmService.queryDBgraph(prompt);
    console.log(response);

    return response;
  }

  @Post('approve')
  async approve(
    @Body()
    body: {
      threadId: string;
      approved: boolean;
      feedback?: string;
    },
  ): Promise<any> {
    const { threadId, approved, feedback } = body;
    const response = await this.llmService.resumeWithApproval(
      threadId,
      approved,
      feedback,
    );

    return response;
  }

  @Post('query-marketgraph')
  async queryMarketGraph(
    @Req() request: Request,
    @Body() body: { ticker: string; type: string },
  ): Promise<any> {
    const response = await this.llmService.queryMarketGraph(body);
    console.log(response);

    return response;
  }
}
