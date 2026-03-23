import { Test, TestingModule } from '@nestjs/testing';
import { ChatDatabaseService } from './chat-database.service';

describe('ChatDatabaseService', () => {
  let service: ChatDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatDatabaseService],
    }).compile();

    service = module.get<ChatDatabaseService>(ChatDatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
