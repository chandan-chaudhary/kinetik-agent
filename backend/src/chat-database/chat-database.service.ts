import { ChatSessionService } from '@/chat-session/chat-session.service';
import { CompiledGraph, GraphResult, StateType } from '@/config/schemas';
import { LanggraphService } from '@/langgraph/langgraph.service';
import { LlmService } from '@/llm/llm.service';
import { ContentBlock, HumanMessage } from '@langchain/core/messages';
import { Command } from '@langchain/langgraph';
import { Injectable, HttpStatus } from '@nestjs/common';
import {
  DbType,
  type LlmProvider,
  isDbType,
  isLlmProvider,
} from '@/types/chat-config.types';
import { createError, customError } from '@/common/customError';

@Injectable()
export class ChatDatabaseService {
  constructor(
    private readonly langgraphService: LanggraphService,
    private readonly llmService: LlmService,
    private readonly chatSessionService: ChatSessionService,
  ) {}

  async queryDBgraph(
    prompt: string,
    config: {
      sessionId: string;
      userId: string;
      llmProvider?: LlmProvider;
      credentialId?: string;
      model?: string;
      apiKey?: string;
      databaseUrl?: string;
      dbType?: DbType;
    },
  ): Promise<any> {
    try {
      // 1. Load session to get stable threadId
      const session = await this.chatSessionService.findOne(
        config.sessionId,
        config.userId,
      );
      if (!session) {
        throw createError('Session not found', {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      // 2. Persist user message
      await this.chatSessionService.appendMessage(
        config.sessionId,
        config.userId,
        {
          role: 'user',
          content: prompt,
          timestamp: new Date().toISOString(),
        },
      );

      const sessionRecord = session as unknown as Record<string, unknown>;
      const sessionLlmProvider = isLlmProvider(sessionRecord.llmProvider)
        ? sessionRecord.llmProvider
        : undefined;
      const sessionLlmCredentialId =
        typeof sessionRecord.llmCredentialId === 'string'
          ? sessionRecord.llmCredentialId
          : undefined;
      const sessionLlmModel =
        typeof sessionRecord.llmModel === 'string'
          ? sessionRecord.llmModel
          : undefined;
      const sessionLlmApiKey =
        typeof sessionRecord.llmApiKey === 'string'
          ? sessionRecord.llmApiKey
          : undefined;

      // 3. Resolve LLM config (request overrides, then persisted session settings)
      const resolvedLlmProvider =
        config.llmProvider || sessionLlmProvider || undefined;
      const resolvedCredentialId =
        config.credentialId || sessionLlmCredentialId || undefined;
      const resolvedModel = config.model || sessionLlmModel || undefined;
      const resolvedApiKey = config.apiKey || sessionLlmApiKey || undefined;

      // 4. Init LLM
      await this.llmService.getLLMInstance({
        llmProvider: resolvedLlmProvider,
        credentialId: resolvedCredentialId,
        model: resolvedModel,
        apiKey: resolvedApiKey,
      });

      // 5. Build graph with session's databaseUrl if not overridden
      const databaseUrl =
        config.databaseUrl || session.databaseUrl || undefined;
      const dbType = isDbType(config.dbType)
        ? config.dbType
        : isDbType(session.dbType)
          ? session.dbType
          : undefined;

      if (
        !databaseUrl ||
        !dbType ||
        (!resolvedCredentialId && !resolvedLlmProvider)
      ) {
        throw createError(
          'Session is not configured. Please provide databaseUrl, dbType, and LLM configuration.',
          {
            httpStatus: HttpStatus.BAD_REQUEST,
          },
        );
      }

      const dbAgent: CompiledGraph = this.langgraphService.initDatabaseGraph(
        databaseUrl,
        dbType,
      );

      // 6. Use session's threadId — same thread = LangGraph replays history from checkpointer
      const threadId = session.threadId;
      const invokeConfig = { configurable: { thread_id: threadId } };

      const result = (await dbAgent.invoke(
        {
          messages: [new HumanMessage(prompt)],
          userQuery: prompt,
          sqlAttempts: 0,
          approved: false,
        },
        invokeConfig,
      )) as GraphResult<StateType>;

      // 7. Handle interrupt (approval needed)
      if (result.__interrupt__ && result.__interrupt__.length > 0) {
        return {
          interrupted: true,
          threadId,
          sessionId: config.sessionId,
          content: result.__interrupt__[0]?.value,
          state: result,
        };
      }

      // 8. Handle completion — persist assistant message
      if (result && 'messages' in result) {
        const messages = (result as { messages: { content: string }[] })
          .messages;
        const lastContent = messages[messages.length - 1].content;

        await this.chatSessionService.appendMessage(
          config.sessionId,
          config.userId,
          {
            role: 'assistant',
            content: lastContent,
            timestamp: new Date().toISOString(),
          },
        );

        return {
          completed: true,
          threadId,
          sessionId: config.sessionId,
          content: lastContent,
        };
      }

      return result;
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to process database query',
      });
    }
  }

  // Resume execution after human approval
  async resumeWithApproval(
    threadId: string,
    approved: boolean,
    feedback?: string,
  ): Promise<string | Record<string, any> | (ContentBlock | Text)[]> {
    try {
      console.log(
        '🔄 Resuming with approval:',
        approved,
        'feedback:',
        feedback,
      );

      const config = {
        configurable: { thread_id: threadId },
      };

      // Re-build graph with shared checkpointer — schema node won't re-run on resume
      const dbAgent: CompiledGraph = this.langgraphService.initDatabaseGraph(
        '',
        DbType.MONGODB,
      );

      // Resume with the decision using Command pattern
      const result = await dbAgent.invoke(
        new Command({ resume: { approved, feedback } }),
        config,
      );

      console.log(
        '✅ Resume completed:',
        (result as GraphResult<StateType>).approved
          ? 'Approved'
          : 'Regenerating',
      );
      if (result && typeof result === 'object' && 'messages' in result) {
        const messages = (result as { messages: { content: string }[] })
          .messages;
        console.log(
          '📝 Final message:',
          messages[messages.length - 1].content.slice(0, 100),
        );
        return {
          completed: true,
          threadId: threadId,
          content: messages[messages.length - 1].content,
          // state: result,
        };
      }
      return result;
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to resume approval flow',
      });
    }
  }
}
