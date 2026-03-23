import { Test, TestingModule } from '@nestjs/testing';
import { CredentailsService } from './credentails.service';

describe('CredentailsService', () => {
  let service: CredentailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CredentailsService],
    }).compile();

    service = module.get<CredentailsService>(CredentailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
