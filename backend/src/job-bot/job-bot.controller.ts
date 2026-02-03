import { Body, Controller, Post } from '@nestjs/common';
import { JobBotService } from './job-bot.service';

@Controller('job-bot')
export class JobBotController {
  constructor(private readonly jobBotService: JobBotService) {}

  @Post('run-automation')
  async runAutomation(
    @Body() body: { url: string; highLevelGoal: string },
  ): Promise<{ success: boolean; message: string; url: string }> {
    await this.jobBotService.browserNode(body.url, body.highLevelGoal);
    return {
      success: true,
      message: 'Visual automation started successfully',
      url: body.url,
    };
  }
}
