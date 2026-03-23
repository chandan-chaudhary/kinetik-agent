import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { WorkflowService } from './workflow.service';
import { Prisma } from '@prisma/client';
// import { HumanMessage } from '@langchain/core/messages';
// import { Command } from '@langchain/langgraph';
// import { GraphResult, StateType } from '@/config/schemas';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '@/types/auth.types';
import { WorkflowGraphExecutionService } from './workflow-graph-execution.service';

@UseGuards(AuthGuard('jwt'))
@Controller('workflow')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly graphExecutionService: WorkflowGraphExecutionService,
  ) {}

  @Post()
  async create(
    @Body() data: Prisma.WorkflowCreateInput,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      const userId = request.user?.userId;
      if (!userId) {
        console.warn(
          '⚠️  No user information found in request. Assigning default userId.',
        );
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const result = await this.workflowService.create(data, userId);
      return result;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw new HttpException(
        'Failed to create workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(@Req() request: AuthenticatedRequest) {
    try {
      const userId = request.user?.userId;
      if (!userId) {
        console.warn(
          '⚠️  No user information found in request. Unable to fetch workflows.',
        );
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const result = await this.workflowService.findAll(userId);
      return result;
    } catch (error) {
      console.error('Error fetching workflows:', error);
      throw new HttpException(
        'Failed to fetch workflows',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    try {
      const userId = request.user?.userId;
      if (!userId) {
        console.warn(
          '⚠️  No user information found in request. Unable to fetch workflows.',
        );
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const result = await this.workflowService.findOne(id, userId);
      return result;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw new HttpException(
        'Failed to fetch workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.WorkflowUpdateInput,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      const userId = request.user?.userId;
      if (!userId) {
        console.warn(
          '⚠️  No user information found in request. Unable to update workflow.',
        );
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const result = await this.workflowService.update(id, data, userId);
      console.log(result);
      return result;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw new HttpException(
        'Failed to update workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    try {
      const userId = request.user?.userId;
      if (!userId) {
        console.warn(
          '⚠️  No user information found in request. Unable to delete workflow.',
        );
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const result = await this.workflowService.remove(id, userId);
      return result;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw new HttpException(
        'Failed to delete workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Execute a workflow with a user prompt
   * POST /workflow/:id/execute
   */
  // @Post(':id/execute')
  // async execute(
  //   @Param('id') id: string,
  //   @Body() body: { prompt: string },
  //   @Req() request: AuthenticatedRequest,
  // ): Promise<any> {
  //   try {
  //     console.log(`🚀 Executing workflow ${id} with prompt: ${body.prompt}`);
  //     const userId = request.user?.userId;
  //     if (!userId) {
  //       console.warn(
  //         '⚠️  No user information found in request. Unable to execute workflow.',
  //       );
  //       throw new HttpException(
  //         'User not authenticated',
  //         HttpStatus.UNAUTHORIZED,
  //       );
  //     }
  //     // Load workflow from database
  //     const workflow = await this.workflowService.findOne(id, userId);

  //     if (!workflow) {
  //       throw new HttpException(
  //         `Workflow with id ${id} not found`,
  //         HttpStatus.NOT_FOUND,
  //       );
  //     }

  //     // Build the dynamic graph
  //     const graphData = this.executorService.buildGraph(workflow);

  //     if (!graphData) {
  //       throw new HttpException(
  //         'Failed to build workflow graph',
  //         HttpStatus.INTERNAL_SERVER_ERROR,
  //       );
  //     }

  //     const { graph } = graphData;

  //     // Generate unique thread ID for this execution
  //     const threadId = `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  //     const config = {
  //       configurable: {
  //         thread_id: threadId,
  //       },
  //     };

  //     // Execute the workflow
  //     const executionResult = (await graph.invoke(
  //       {
  //         messages: [new HumanMessage(body.prompt)],
  //         userQuery: body.prompt,
  //         sqlAttempts: 0,
  //         approved: false,
  //       },
  //       config,
  //     )) as GraphResult<StateType>;

  //     console.log(
  //       '📥 Execution result:',
  //       typeof executionResult,
  //       Object.keys(executionResult),
  //     );

  //     // Check if execution was interrupted (e.g., waiting for approval)
  //     if (
  //       executionResult.__interrupt__ &&
  //       executionResult.__interrupt__.length > 0
  //     ) {
  //       console.log('⏸️  Execution interrupted for approval');
  //       const interruptValue = executionResult.__interrupt__[0]?.value as
  //         | { question?: string }
  //         | undefined;

  //       return {
  //         interrupted: true,
  //         threadId,
  //         workflowId: id,
  //         content: {
  //           question:
  //             interruptValue?.question ||
  //             'Does the SQL query and result match your requirements?',
  //           response: executionResult.queryResult, // LLM's formatted message
  //         },
  //         // state: {
  //         //   userQuery: executionResult.userQuery,
  //         //   generatedSql: executionResult.generatedSql,
  //         //   queryResult: executionResult.queryResult,
  //         //   sqlAttempts: executionResult.sqlAttempts,
  //         // },
  //       };
  //     }

  //     // Execution completed without interruption
  //     if (
  //       executionResult &&
  //       typeof executionResult === 'object' &&
  //       'messages' in executionResult
  //     ) {
  //       const messages = executionResult.messages as { content: string }[];
  //       console.log('✅ Execution completed');
  //       return {
  //         completed: true,
  //         threadId,
  //         workflowId: id,
  //         content: messages[messages.length - 1].content,
  //       };
  //     }

  //     return executionResult;
  //   } catch (error) {
  //     console.error('❌ Error executing workflow:', error);
  //     throw new HttpException(
  //       error instanceof Error ? error.message : 'Failed to execute workflow',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  /**
   * Stream workflow execution events over SSE.
   * GET /workflow/:id/execute/stream
   * Emits: node_start, node_end, node_error, done, error
   */
  @Sse(':id/execute/stream')
  executeStream(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Observable<MessageEvent> {
    const userId = request.user?.userId;
    if (!userId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return new Observable<MessageEvent>((subscriber) => {
      (async () => {
        try {
          const workflow = await this.workflowService.findOne(id, userId);
          if (!workflow) {
            subscriber.next({
              data: JSON.stringify({
                event: 'error',
                message: 'Workflow not found',
              }),
            });
            subscriber.complete();
            return;
          }

          for await (const event of this.graphExecutionService.streamWorkflow(
            workflow,
            {},
          )) {
            if (subscriber.closed) break;
            subscriber.next({ data: JSON.stringify(event) });
          }
        } catch (err) {
          subscriber.next({
            data: JSON.stringify({ event: 'error', message: String(err) }),
          });
        } finally {
          subscriber.complete();
        }
      })().catch((err) => {
        subscriber.error(err);
      });
    });
  }

  @Post(':id/execute')
  async execute(
    @Param('id') id: string,
    @Body() body: { prompt?: string; input?: unknown },
    @Req() request: AuthenticatedRequest,
  ): Promise<any> {
    try {
      console.log(`🚀 Executing workflow ${id} with prompt: ${body.prompt}`);
      const userId = request.user?.userId;
      if (!userId) {
        console.warn(
          '⚠️  No user information found in request. Unable to execute workflow.',
        );
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }
      // Load workflow from database
      const workflow = await this.workflowService.findOne(id, userId);

      if (!workflow) {
        throw new HttpException(
          `Workflow with id ${id} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      return await this.graphExecutionService.executeWorkflow(workflow, {
        prompt: body.prompt,
        input: body.input,
      });
    } catch (error) {
      console.error('❌ Error executing workflow:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to execute workflow',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
