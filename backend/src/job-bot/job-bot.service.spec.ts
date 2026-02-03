import { Test, TestingModule } from '@nestjs/testing';
import { JobBotService } from './job-bot.service';

describe('JobBotService', () => {
  let service: JobBotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobBotService],
    }).compile();

    service = module.get<JobBotService>(JobBotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
