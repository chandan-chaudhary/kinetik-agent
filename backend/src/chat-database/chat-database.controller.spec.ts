import { Test, TestingModule } from '@nestjs/testing';
import { ChatDatabaseController } from './chat-database.controller';
import { ChatDatabaseService } from './chat-database.service';

describe('ChatDatabaseController', () => {
  let controller: ChatDatabaseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatDatabaseController],
      providers: [ChatDatabaseService],
    }).compile();

    controller = module.get<ChatDatabaseController>(ChatDatabaseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
