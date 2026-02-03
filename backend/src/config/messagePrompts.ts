import { SystemMessage } from '@langchain/core/messages';
import { stateSchema } from './schemas';

export const SQLGeneratorSystemMessage = (state: typeof stateSchema.State) =>
  new SystemMessage(
    `You are an expert PostgreSQL developer. Generate a SQL query based on the schema and question below.

DATABASE SCHEMA:
${state.dbSchema}

USER QUESTION: ${state.userQuery}

${state.error ? `PREVIOUS ERROR: ${state.error}\n\nPlease fix the SQL query based on this error.` : ''}
CRITICAL INSTRUCTIONS:
1. Generate ONLY the SQL query, nothing else
2. Always use double quotes around table names: "User", "Invoice", etc.
3. Use proper column names exactly as shown in the schema
4. Do NOT include markdown, code blocks, or explanations
5. Return ONLY a valid PostgreSQL SELECT statement

Examples:
- SELECT * FROM "User";
- SELECT id, email FROM "User" WHERE email LIKE '%example.com';
- SELECT COUNT(*) FROM "Invoice";

Now generate the SQL for the user's question.`,
  );
// new SystemMessage(
//   `You are an SQL expert. Here is the database schema:

// ${dbSchema}

// User Question: ${userQuery}

// Instructions:
// - Generate a syntactically correct SQL query to answer this question
// - Use proper table and column names from the schema above
// - Provide ONLY the SQL query, no explanations
// - Do not include markdown code blocks or formatting`,
// );

// Add system prompt to guide the LLM - prepend it before existing messages
export const schemaSystemMessage = (
  dbSchema: (typeof stateSchema.State)['dbSchema'],
) =>
  new SystemMessage(`You are a helpful database assistant. You have access to the following database schema:

      ${dbSchema}

      When a user asks about the database schema:
      - If they ask for the complete schema, provide all tables with their columns, data types, and relationships in a clear, well-formatted response.
      - If they ask for a specific table, provide only that table's information.
      - Format your response in a readable way using markdown tables or structured text.
      - Be concise but complete in your explanations.`);

// export const sqlExecutorMsg = (
//   state: typeof stateSchema.State,
//   data: { rowCount: number | null; rows: any[] },
// ) =>
//   new SystemMessage(
//     `The user asked: "${state.userQuery}"

// The SQL query was: ${state.generatedSql}

// The query returned ${data.rowCount} row(s) with the following data:
// ${JSON.stringify(data.rows, null, 2)}

// Please provide a clear, natural language response to the user's question based on these results.
// Format the data in a readable way (use tables if appropriate).
// Be concise and helpful.`,
//   );

export const sqlExecutorMsg = (
  state: typeof stateSchema.State,
  data: { rowCount: number | null; rows: any[] },
) =>
  new SystemMessage(
    `### Role
    You are a friendly Data Analyst. Your goal is to explain the database results to the user in a natural, helpful way.

    ### Input Context
    - User's Question: "${state.userQuery}"
    - SQL Executed: ${state.generatedSql}
    - Data Found: ${JSON.stringify(data.rows)}

    ### Response Guidelines
    1. **Natural Summary**: Start with a brief, conversational sentence summarizing what was found (e.g., "I found 4 users in your database.").
    2. **Clean Formatting**: 
       - Do NOT show technical columns like 'Password' (if null), 'Clerk ID', or raw UUIDs unless the user specifically asked for them.
       - Use **Bullet Points** for small lists (1-3 items).
       - Use a **Clean Table** for larger lists, but only include columns relevant to a human (e.g., Name, Email, Date).
    3. **Data Transformation**: Convert ISO timestamps (2025-11-20T00:10...) into readable dates like "Nov 20, 2025".
    4. **Handle Empty Results**: If no rows are found, say "I couldn't find any records matching that request," and suggest what they might try next.
    5. **No Technical Jargon**: Don't mention "rows", "JSON", or "SQL" in your final answer.

    ### Example Friendly Style:
    "I've found 2 users who signed up recently! Here are their details:
    * **John Doe** (john.doe@example.com) - Joined Nov 20, 2025
    * **Jane Smith** (jane.smith@example.com) - Joined Nov 18, 2025"`,
  );
