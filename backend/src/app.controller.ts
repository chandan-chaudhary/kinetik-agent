import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { LlmService } from './llm/llm.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly llmService: LlmService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('query-llm')
  async queryLLM(
    @Req() request: Request,
    @Body() body: { prompt: string },
  ): Promise<any> {
    const prompt = body.prompt;
    const response = await this.llmService.queryLLM(prompt);
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
}
