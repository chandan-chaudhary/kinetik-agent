import { MessagesValue, StateSchema } from '@langchain/langgraph';
import { Pool } from 'pg';
import llmConfig from './llm.config';
import z from 'zod';

let pool: Pool | null = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || llmConfig().databaseUrl,
    });
  }
  return pool;
};

export const getClient = async () => {
  const pool = getPool();
  return await pool.connect();
};

interface DbRow {
  table_name: string;
  column_name: string;
  data_type: string;
}

export const getDbSchema = async () => {
  console.log(
    'DATABASE_URL:',
    process.env.DATABASE_URL ? 'Found' : 'Not found',
  );

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return 'Database schema not available: DATABASE_URL not configured';
  }

  try {
    const client = await getClient();
    console.log('Database connection successful');

    try {
      const res = await client.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);

      // Grouping the columns by table for the AI
      const schema = (res.rows as DbRow[]).reduce(
        (acc: Record<string, string[]>, row: DbRow) => {
          const { table_name, column_name, data_type } = row;
          if (!acc[table_name]) acc[table_name] = [];
          acc[table_name].push(`${column_name} (${data_type})`);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      const result = Object.entries(schema)
        .map(([table, cols]) => `Table: ${table}\nColumns: ${cols.join(', ')}`)
        .join('\n\n');

      console.log('Database schema fetched successfully');
      return result || 'No tables found in the database';
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return `Database schema not available: ${error instanceof Error ? error.message : String(error)}`;
  }
};

export const stateSchema = new StateSchema({
  messages: MessagesValue,

  userQuery: z.string().default(''),
  // Schema of the database
  dbSchema: z.string().default(''),
  // Generated SQL query
  generatedSql: z.string().default(''),
  // Query result
  queryResult: z.record(z.any(), z.any()).default({}),
  // Error information
  error: z.string().optional().nullable(),
  sqlAttempts: z.number().default(0),
  approved: z.boolean().default(false),
  feedback: z.string().optional().nullable(),
});
// Type for graph result that might be interrupted
export type GraphResult<T = any> = T & {
  __interrupt__?: Array<{
    value: Record<string, any>;
    resumable: boolean;
    ns?: string[];
    when?: 'during' | 'before';
  }>;
};
export type StateType = typeof stateSchema.State;
