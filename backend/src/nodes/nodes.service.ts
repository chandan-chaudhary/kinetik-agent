import {
  Command,
  ConditionalEdgeRouter,
  END,
  GraphNode,
  interrupt,
} from '@langchain/langgraph';
import { Injectable } from '@nestjs/common';
import { getClient, getDbSchema, stateSchema } from 'src/config/schemas';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import {
  sqlExecutorMsg,
  // schemaSystemMessage,
  SQLGeneratorSystemMessage,
} from 'src/config/messagePrompts';

@Injectable()
export class NodesService {
  constructor() {}
  getSchemaNode(): GraphNode<typeof stateSchema> {
    return async (state: typeof stateSchema.State) => {
      console.log('🔍 Schema node executing...');
      // const messages = state.messages as BaseMessage[];
      state.messages.forEach((msg, i) => {
        console.log(
          `Message ${i}:`,
          msg.constructor.name,
          '- Content length:',
          typeof msg.content === 'string' ? msg.content.length : 'N/A',
        );
      });
      try {
        const dbSchema = await getDbSchema();

        // Add system prompt first to guide the LLM
        // const schemaSystemMsg = schemaSystemMessage(dbSchema);
        console.log(
          '✅ Schema node completed, schema length:',
          dbSchema.length,
        );
        return { dbSchema: dbSchema };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };
  }

  // GET LLM NODE
  getLLMNode(llmInstance: BaseChatModel): GraphNode<typeof stateSchema> {
    return async (state: typeof stateSchema.State) => {
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
    llmInstance: BaseChatModel,
  ): GraphNode<typeof stateSchema> {
    return async (state: typeof stateSchema.State) => {
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
    llmInstance: BaseChatModel,
  ): GraphNode<typeof stateSchema> {
    return async (state: typeof stateSchema.State) => {
      console.log('🚀 SQL Executor node executing...');
      // Implementation for executing the generated SQL against the database;
      const dbClient = await getClient();
      try {
        console.log('✅ SQL Executor node completed');
        const data = await dbClient.query(state.generatedSql);
        // console.log(data, 'db DATA in sqlExecutor');
        const systemMessage = sqlExecutorMsg(state, data);
        const result = await llmInstance.invoke([systemMessage]);
        return { messages: [result], queryResult: data };
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

  // Human approval node for SQL validation
  approvalNode(): GraphNode<typeof stateSchema> {
    return (state: typeof stateSchema.State) => {
      console.log('✅ Approval node executing...');
      console.log('Generated SQL:', state.generatedSql);
      console.log(
        'Query Result:',
        JSON.stringify(state.queryResult).slice(0, 200),
      );

      // Interrupt for human approval with context
      const approval: { approved: boolean; feedback?: string } = interrupt({
        question: 'Does the SQL query and result match your requirements?',
        generatedSql: state.generatedSql,
        queryResult: state.queryResult as any[],
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
            humanFeedback: approval.feedback || null,
          },
        });
      } else {
        console.log('🔁 Regenerating SQL with feedback');
        return new Command({
          goto: 'sqlGenerator',
          update: {
            approved: false,
            humanFeedback: approval.feedback || null,
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
