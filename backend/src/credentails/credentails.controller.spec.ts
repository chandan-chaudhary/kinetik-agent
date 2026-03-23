import { Test, TestingModule } from '@nestjs/testing';
import { CredentailsController } from './credentails.controller';
import { CredentailsService } from './credentails.service';

describe('CredentailsController', () => {
  let controller: CredentailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CredentailsController],
      providers: [CredentailsService],
    }).compile();

    controller = module.get<CredentailsController>(CredentailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
