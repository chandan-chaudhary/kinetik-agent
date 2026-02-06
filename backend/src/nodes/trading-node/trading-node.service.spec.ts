import { Test, TestingModule } from '@nestjs/testing';
import { TradingNodeService } from './trading-node.service';

describe('TradingNodeService', () => {
  let service: TradingNodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TradingNodeService],
    }).compile();

    service = module.get<TradingNodeService>(TradingNodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
