import { Module } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { NodesController } from './nodes.controller';
import { NodeTemplateService } from './node-template.service';

@Module({
  controllers: [NodesController],
  providers: [NodesService, NodeTemplateService],
})
export class NodesModule {}
