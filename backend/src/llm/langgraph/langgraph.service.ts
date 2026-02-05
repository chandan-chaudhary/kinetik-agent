import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { StateGraph, START, MemorySaver, END } from '@langchain/langgraph';
import { stateSchema } from 'src/config/schemas';
import { NodesService } from 'src/nodes/nodes.service';
import { LlmService } from '../llm.service';

@Injectable()
export class LanggraphService {
  private checkpointer = new MemorySaver();

  constructor(
    private nodesService: NodesService,
    @Inject(forwardRef(() => LlmService))
    private readonly llmService: LlmService,
  ) {}

  initGraph() {
    const databse = 'DATABASE_URL_PLACEHOLDER';
    const graph = new StateGraph(stateSchema)
      .addNode('schema', this.nodesService.getSchemaNode(databse))
      .addNode(
        'sqlGenerator',
        this.nodesService.getSQLGeneratorNode(this.llmService.LLM),
      )
      .addNode(
        'sqlExecutor',
        this.nodesService.getSQLExecutorNode(this.llmService.LLM),
      )
      .addNode('approval', this.nodesService.approvalNode(), {
        ends: ['sqlGenerator', '__end__'],
      })

      .addEdge(START, 'schema')
      .addEdge('schema', 'sqlGenerator')
      .addEdge('sqlGenerator', 'sqlExecutor')
      .addConditionalEdges(
        'sqlExecutor',
        this.nodesService.shouldContinueNode(),
        {
          sqlGenerator: 'sqlGenerator',
          approval: 'approval',
          __end__: END,
        },
      )
      .compile({
        checkpointer: this.checkpointer,
        interruptBefore: ['approval'],
      });

    console.log(
      '📊 Graph compiled successfully with Command-based approval flow',
    );
    return graph;
  }
}
