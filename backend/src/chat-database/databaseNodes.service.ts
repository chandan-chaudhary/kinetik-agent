import {
  Command,
  ConditionalEdgeRouter,
  END,
  GraphNode,
  interrupt,
} from '@langchain/langgraph';
import { Injectable } from '@nestjs/common';
import {
  executeMongoQuery,
  getClient,
  getDbSchema,
  getMongoSchema,
  stateSchema,
} from '@/config/schemas';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import {
  mongoExecutorMsg,
  MongoQueryGeneratorSystemMessage,
  sqlExecutorMsg,
  SQLGeneratorSystemMessage,
} from '@/config/messagePrompts';
import { DbType } from '@/types/chat-config.types';

@Injectable()
export class DatabaseNodesService {
  constructor() {}

  getSchemaNode(
    databaseUrl?: string,
    dbType: DbType = DbType.POSTGRES,
  ): GraphNode<typeof stateSchema> {
    return async (state: typeof stateSchema.State) => {
      console.log(`🔍 Schema node executing... [${dbType}]`, databaseUrl);
      state.messages.forEach((msg, i) => {
        console.log(
          `Message ${i}:`,
          msg.constructor.name,
          '- Content length:',
          typeof msg.content === 'string' ? msg.content.length : 'N/A',
        );
      });
      try {
        console.log('in schema generating', dbType);

        const dbSchema =
          dbType === DbType.MONGODB && databaseUrl
            ? await getMongoSchema(databaseUrl)
            : await getDbSchema(databaseUrl);
        console.log(
          '✅ Schema node completed, schema length:',
          dbSchema.length,
        );
        return { dbSchema };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };
  }

  // GET LLM NODE
  getLLMNode(getLLM: () => BaseChatModel): GraphNode<typeof stateSchema> {
    return async (state: typeof stateSchema.State) => {
      const llmInstance = getLLM();
      console.log('🤖 LLM node executing...');
      console.log('Messages to LLM:', state.messages.length);
      state.messages.forEach((msg, idx) => {
        const contentPreview =
          typeof msg.content === 'string'
            ? msg.content.substring(0, 150) + '...'
            : JSON.stringify(msg.content).substring(0, 150) + '...';
        console.log(`  [${idx}] ${msg.type}:`, contentPreview);
      });

      const response = await llmInstance.invoke(
        state.messages as BaseLanguageModelInput,
      );
      console.log(
        '✅ LLM response received:',
        typeof response,
        response.content?.slice(0, 100),
      );
      return { messages: [response] };
    };
  }

  getSQLGeneratorNode(
    getLLM: () => BaseChatModel,
  ): GraphNode<typeof stateSchema> {
    return async (state: typeof stateSchema.State) => {
      const llmInstance = getLLM();
      console.log('🧩 SQL Generator node executing...');
      console.log('User question for SQL generation:', state.userQuery);
      console.log('HUMAN feedback for SQL generation:', state.feedback);

      console.log('Database schema length:', state.dbSchema?.length);

      // Include human feedback if regenerating
      if (state.feedback) {
        console.log('📝 Using human feedback:', state.feedback);
      }

      const systemMessage = SQLGeneratorSystemMessage(state);

      try {
        const result = await llmInstance.invoke([systemMessage]);
        const generatedSql =
          typeof result.content === 'string'
            ? result.content
                .trim()
                .replace(/```sql|```/g, '')
                .trim() // Remove markdown
            : '';
        console.log(generatedSql, 'in generated sql');

        return {
          messages: [result],
          generatedSql: generatedSql,
          error: null,
          sqlAttempts: (state.sqlAttempts || 0) + 1,
        };
      } catch (error) {
        console.error('Error generating SQL:', error);
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };
  }

  getSQLExecutorNode(
    getLLM: () => BaseChatModel,
    databaseUrl?: string,
  ): GraphNode<typeof stateSchema> {
    return async (state: typeof stateSchema.State) => {
      const llmInstance = getLLM();
      console.log('🚀 SQL Executor node executing...');
      const dbClient = await getClient(databaseUrl);
      try {
        console.log('✅ SQL Executor node completed');
        const data = await dbClient.query(state.generatedSql);
        // console.log(data, 'db DATA in sqlExecutor');
        const systemMessage = sqlExecutorMsg(state, data);
        const result = await llmInstance.invoke([systemMessage]);

        // Store the LLM's formatted response as queryResult
        const queryResult =
          typeof result.content === 'string'
            ? result.content
            : JSON.stringify(result.content);

        return {
          messages: [result],
          queryResult: queryResult,
          // rawData: data.rows, // Store raw rows separately if needed
        };
      } catch (error) {
        console.error('Error executing SQL query:', error);
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      } finally {
        dbClient.release();
      }
    };
  }

  // ─── MongoDB nodes ────────────────────────────────────────────────────

  getMongoQueryGeneratorNode(
    getLLM: () => BaseChatModel,
  ): GraphNode<typeof stateSchema> {
    return async (state: typeof stateSchema.State) => {
      const llmInstance = getLLM();
      console.log('🧩 Mongo Query Generator node executing...');
      console.log('User question:', state.userQuery);
      if (state.feedback)
        console.log('📝 Using human feedback:', state.feedback);

      const systemMessage = MongoQueryGeneratorSystemMessage(state);
      try {
        const result = await llmInstance.invoke([systemMessage]);
        const raw =
          typeof result.content === 'string' ? result.content.trim() : '';
        // Strip possible markdown fences
        const generatedQuery = raw
          .replace(/^```(?:json)?\n?/, '')
          .replace(/\n?```$/, '')
          .trim();

        // Validate it is parseable JSON
        JSON.parse(generatedQuery);

        console.log('Generated MongoDB query:', generatedQuery);
        return {
          messages: [result],
          generatedSql: generatedQuery, // reuse field to store query JSON
          error: null,
          sqlAttempts: (state.sqlAttempts || 0) + 1,
        };
      } catch (error) {
        console.error('Error generating MongoDB query:', error);
        return {
          error: error instanceof Error ? error.message : String(error),
          sqlAttempts: (state.sqlAttempts || 0) + 1,
        };
      }
    };
  }

  getMongoExecutorNode(
    getLLM: () => BaseChatModel,
    databaseUrl?: string,
  ): GraphNode<typeof stateSchema> {
    return async (state: typeof stateSchema.State) => {
      const llmInstance = getLLM();
      console.log('🚀 Mongo Executor node executing...');
      if (!databaseUrl) {
        return { error: 'No MongoDB connection URL provided' };
      }
      try {
        const data = await executeMongoQuery(databaseUrl, state.generatedSql);
        console.log('✅ Mongo query executed, rows:', data.length);
        const systemMessage = mongoExecutorMsg(state, data);
        const result = await llmInstance.invoke([systemMessage]);
        const queryResult =
          typeof result.content === 'string'
            ? result.content
            : JSON.stringify(result.content);
        return { messages: [result], queryResult, error: null };
      } catch (error) {
        console.error('Error executing MongoDB query:', error);
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };
  }

  // Human approval node for SQL/Mongo query validation
  approvalNode(nodeId?: string): GraphNode<typeof stateSchema> {
    return (state: typeof stateSchema.State) => {
      console.log('✅ Approval node executing...');
      console.log('Generated SQL:', state.generatedSql);
      console.log(
        'Query Result:',
        typeof state.queryResult === 'string'
          ? state.queryResult.slice(0, 200)
          : JSON.stringify(state.queryResult).slice(0, 200),
      );

      // Interrupt for human approval with context
      const approval: { approved: boolean; feedback?: string } = interrupt({
        question: 'Does the SQL query and result match your requirements?',
        generatedSql: state.generatedSql,
        queryResult: state.queryResult, // Now contains the LLM's formatted response
        userQuery: state.userQuery,
        sqlAttempts: state.sqlAttempts || 1,
      });

      console.log('Approval received:', approval);

      // Check max attempts (prevent infinite loops)
      const maxAttempts = 10;
      if (state.sqlAttempts >= maxAttempts) {
        console.log('⚠️ Max SQL generation attempts reached');
        return new Command({
          goto: END,
          update: {
            approved: false,
            humanFeedback: 'Max attempts reached',
          },
        });
      }

      // Route based on approval
      if (approval.approved) {
        console.log('✅ Query approved - ending workflow');
        return new Command({
          goto: END,
          update: {
            approved: true,
            feedback: approval.feedback || null,
          },
        });
      } else {
        console.log('🔁 Regenerating query with feedback');
        return new Command({
          goto: nodeId || 'queryGenerator',
          update: {
            approved: false,
            feedback: approval.feedback || null,
          },
        });
      }
    };
  }

  shouldContinueNode(): ConditionalEdgeRouter<typeof stateSchema> {
    return (state: typeof stateSchema.State) => {
      console.log('🔄 Should Continue node executing...');
      // Logic to determine if the graph should continue or stop
      const hasError = !!state.error;
      if (hasError) {
        console.log('❌ Error detected:', state.error);
        // Check if we should retry or end
        const maxAttempts = 10;
        if (state.sqlAttempts >= maxAttempts) {
          console.log('⚠️ Max attempts reached after errors');
          return END;
        }
        console.log('🔄  Re-generating SQL query...');

        return 'sqlGenerator';
      }

      console.log('✅ No errors - proceeding to approval');
      return 'approval';
    };
  }
}
