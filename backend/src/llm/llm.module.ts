import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { NodesService } from 'src/nodes/nodes.service';

@Module({
  providers: [LlmService, NodesService],
  imports: [],
  exports: [LlmService],
})
export class LlmModule {}
