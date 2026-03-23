import { Module } from '@nestjs/common';
import { CredentailsService } from './credentails.service';
import { CredentailsController } from './credentails.controller';

@Module({
  controllers: [CredentailsController],
  providers: [CredentailsService],
  exports: [CredentailsService],
})
export class CredentailsModule {}
