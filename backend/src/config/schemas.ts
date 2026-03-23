import { MessagesValue, StateSchema } from '@langchain/langgraph';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import llmConfig from './llm.config';
import z from 'zod';

let pool: Pool | null = null;

const getPool = (databaseUrl?: string) => {
  console.log('connect ', databaseUrl);

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl || llmConfig().sqlDatabaseUrl,
    });
  }
  return pool;
};

export const getClient = async (databaseUrl?: string) => {
  if (!databaseUrl) {
    const pool = getPool();
    return await pool.connect();
  }
  const pool = getPool(databaseUrl);
  return await pool.connect();
};

interface DbRow {
  table_name: string;
  column_name: string;
  data_type: string;
}

interface EnumRow {
  enum_name: string;
  enum_value: string;
}

export const getDbSchema = async (databaseUrl?: string) => {
  // console.log(
  //   'SQL_DATABASE_URL:',
  //   process.env.SQL_DATABASE_URL ? 'Found' : 'Not found',
  // );

  // if (!process.env.SQL_DATABASE_URL) {
  //   console.error('SQL_DATABASE_URL environment variable is not set');
  //   return 'Database schema not available: SQL_DATABASE_URL not configured';
  // }

  try {
    const client = await getClient(databaseUrl);
    console.log('Database connection successful', databaseUrl);

    try {
      // Fetch table and column information
      const tableRes = await client.query(`
        SELECT table_name, column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);

      // Fetch enum information
      const enumRes = await client.query(`
        SELECT t.typname as enum_name, e.enumlabel as enum_value
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ORDER BY t.typname, e.enumsortorder;
      `);

      // Grouping the columns by table for the AI
      const schema = (tableRes.rows as DbRow[]).reduce(
        (acc: Record<string, string[]>, row: DbRow) => {
          const { table_name, column_name, data_type } = row;
          if (!acc[table_name]) acc[table_name] = [];
          acc[table_name].push(`${column_name} (${data_type})`);
          return acc;
        },
        {} as Record<string, string[]>,
      );

      // Group enums by type
      const enumsByType: Record<string, string[]> = {};
      for (const row of enumRes.rows as EnumRow[]) {
        if (!enumsByType[row.enum_name]) {
          enumsByType[row.enum_name] = [];
        }
        enumsByType[row.enum_name].push(row.enum_value);
      }

      // Build schema string
      let result = Object.entries(schema)
        .map(([table, cols]) => `Table: ${table}\nColumns: ${cols.join(', ')}`)
        .join('\n\n');

      // Add enum definitions if any exist
      if (Object.keys(enumsByType).length > 0) {
        result += '\n\nENUM TYPES:\n';
        result += Object.entries(enumsByType)
          .map(([enumName, values]) => `${enumName}: ${values.join(', ')}`)
          .join('\n');
      }

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
  queryResult: z.string().default(''),
  // Error information
  error: z.string().optional().nullable(),
  sqlAttempts: z.number().default(0),
  approved: z.boolean().default(false),
  feedback: z.string().optional().nullable(),
  // Condition node result for routing
  conditionResult: z.boolean().optional(),
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

// ─── MongoDB ──────────────────────────────────────────────────────────────────

export const getMongoSchema = async (databaseUrl: string): Promise<string> => {
  if (!databaseUrl) {
    return 'Database schema not available: no connection URL provided';
  }
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(databaseUrl);
    await client.connect();
    const db = client.db(); // uses the db in the connection string
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      return 'No collections found in the database';
    }

    const schemaParts: string[] = [];
    for (const col of collections) {
      const sampleDocs = await db
        .collection(col.name)
        .find()
        .limit(3)
        .toArray();

      if (sampleDocs.length === 0) {
        schemaParts.push(`Collection: ${col.name}\n  (empty)`);
        continue;
      }

      // Infer fields + types from sample docs
      const fieldMap: Record<string, Set<string>> = {};
      for (const doc of sampleDocs) {
        for (const [key, val] of Object.entries(doc)) {
          if (!fieldMap[key]) fieldMap[key] = new Set();
          fieldMap[key].add(val === null ? 'null' : typeof val);
        }
      }

      const fields = Object.entries(fieldMap)
        .map(([k, types]) => `${k} (${[...types].join('|')})`)
        .join(', ');

      schemaParts.push(`Collection: ${col.name}\nFields: ${fields}`);
    }

    console.log('MongoDB schema fetched successfully');
    return schemaParts.join('\n\n');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return `Database schema not available: ${
      error instanceof Error ? error.message : String(error)
    }`;
  } finally {
    await client?.close();
  }
};

export const executeMongoQuery = async (
  databaseUrl: string | undefined,
  queryJson: string,
): Promise<Record<string, unknown>[]> => {
  if (!databaseUrl) {
    throw new Error('MongoDB connection URL is required');
  }
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(databaseUrl);
    await client.connect();
    const db = client.db();

    const q = JSON.parse(queryJson) as {
      collection: string;
      operation: 'find' | 'aggregate' | 'count' | 'distinct';
      filter?: Record<string, unknown>;
      projection?: Record<string, unknown>;
      sort?: Record<string, unknown>;
      limit?: number;
      pipeline?: Record<string, unknown>[];
      field?: string; // for distinct
    };

    const col = db.collection(q.collection);

    switch (q.operation) {
      case 'find': {
        const docs = await col
          .find(q.filter ?? {}, { projection: q.projection })
          .sort((q.sort as Record<string, 1 | -1> | undefined) ?? {})
          .limit(q.limit ?? 50)
          .toArray();
        return docs as Record<string, unknown>[];
      }
      case 'aggregate': {
        const docs = await col.aggregate(q.pipeline ?? []).toArray();
        return docs as Record<string, unknown>[];
      }
      case 'count': {
        const count = await col.countDocuments(q.filter ?? {});
        return [{ count }];
      }
      case 'distinct': {
        if (!q.field) throw new Error('distinct requires a field property');
        const values = await col.distinct(q.field, q.filter ?? {});
        return values.map((v) => ({ value: v as unknown }));
      }
      default:
        throw new Error(`Unsupported operation: ${String(q.operation)}`);
    }
  } finally {
    await client?.close();
  }
};

/**
 * Typed wrapper for a compiled LangGraph agent.
 * Avoids depending on LangGraph internal types that cannot be named.
 */
export interface CompiledGraph {
  invoke(
    input: Record<string, unknown> | object,
    config?: { configurable?: Record<string, unknown> },
  ): Promise<Record<string, unknown>>;
}
