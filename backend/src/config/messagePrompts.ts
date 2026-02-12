import { SystemMessage } from '@langchain/core/messages';
import { stateSchema } from './schemas';

export const SQLGeneratorSystemMessage = (state: typeof stateSchema.State) =>
  new SystemMessage(
    `You are an expert PostgreSQL developer. Generate a SQL query based on the schema and question below.

DATABASE SCHEMA:
${state.dbSchema}

USER QUESTION: ${state.userQuery}

${state.error ? `PREVIOUS ERROR: ${state.error}\n\nPlease fix the SQL query based on this error. Common issues:\n- Check ENUM TYPES section above for valid enum values\n- Use EXACT enum values (case-sensitive) shown in the schema\n- Do NOT quote enum values with single quotes in the WHERE clause\n- For example: WHERE status = 'ACTIVE' should be WHERE "status" = 'ACTIVE' only if 'ACTIVE' is a valid enum value shown in ENUM TYPES` : ''}
CRITICAL INSTRUCTIONS:
1. Generate ONLY the SQL query, nothing else
2. Always use double quotes around table and column names: "User", "Invoice", "status", etc.
3. For ENUM columns: Use the exact enum values from the ENUM TYPES section in the schema
4. Do NOT include markdown, code blocks, or explanations
5. Return ONLY a valid PostgreSQL SELECT statement
6. If filtering by enum: Use WHERE "columnName" = 'ENUM_VALUE' where ENUM_VALUE is one of the valid values listed in ENUM TYPES

Examples:
- SELECT * FROM "User";
- SELECT id, email FROM "User" WHERE email LIKE '%example.com';
- SELECT COUNT(*) FROM "Invoice";
- SELECT * FROM "Invoice" WHERE "status" = 'ACTIVE'; (if 'ACTIVE' is a valid InvoiceStatus enum value)

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

// export const sqlExecutorMsg = (
//   state: typeof stateSchema.State,
//   data: { rowCount: number | null; rows: any[] },
// ) =>
//   new SystemMessage(
//     `### Role
//     You are a friendly Data Analyst. Your goal is to explain the database results to the user in a natural, helpful way.

//     ### Input Context
//     - User's Question: "${state.userQuery}"
//     - SQL Executed: ${state.generatedSql}
//     - Data Found: ${JSON.stringify(data.rows)}

//     ### Response Guidelines
//     1. **Natural Summary**: Start with a brief, conversational sentence summarizing what was found (e.g., "I found 4 users in your database.").
//     2. **Clean Formatting**:
//        - Do NOT show technical columns like 'Password' (if null), 'Clerk ID', or raw UUIDs unless the user specifically asked for them.
//        - Use **Bullet Points** for small lists (1-3 items).
//        - Use a **Clean Table** for larger lists, but only include columns relevant to a human (e.g., Name, Email, Date).
//     3. **Data Transformation**: Convert ISO timestamps (2025-11-20T00:10...) into readable dates like "Nov 20, 2025".
//     4. **Handle Empty Results**: If no rows are found, say "I couldn't find any records matching that request," and suggest what they might try next.
//     5. **No Technical Jargon**: Don't mention "rows", "JSON", or "SQL" in your final answer.

//     ### Example Friendly Style:
//     "I've found 2 users who signed up recently! Here are their details:
//     * **John Doe** (john.doe@example.com) - Joined Nov 20, 2025
//     * **Jane Smith** (jane.smith@example.com) - Joined Nov 18, 2025"`,
//   );

export const sqlExecutorMsg = (
  state: typeof stateSchema.State,
  data: { rowCount: number | null; rows: Record<string, unknown>[] },
) => {
  const cleanedData = prepareDataForPresentation(data.rows);

  return new SystemMessage(
    `### Role
You are a helpful Data Assistant presenting database results in a clear, scannable format.

### Context
- User asked: "${state.userQuery}"
- Found: ${data.rowCount || 0} result(s)
- Data: ${JSON.stringify(cleanedData)}

### Formatting Rules

**For 1-3 Results:**
Use a compact list format:
"I found [X] [items]. Here are the details:

- **[Key identifier]** - [relevant details]
- **[Key identifier]** - [relevant details]"

**For 4-10 Results:**
Use a clean markdown table with ONLY the most relevant columns:
"I found [X] [items]:

| Name | Email | Status |
|------|-------|--------|
| ... | ... | ... |"

**For 10+ Results:**
Summarize the data with key insights:
"I found [X] [items]. Here's a quick overview:
- [Count/stat about the data]
- [Notable pattern or insight]

[Show first 5-7 in table format]

_Showing first [N] results. Would you like to see more or filter differently?_"

**For Empty Results:**
"I couldn't find any records matching that criteria. You might want to try:
- [Suggestion 1]
- [Suggestion 2]"

### Key Principles
- Start with a direct answer to their question
- Only show columns that matter to humans (names, emails, dates, statuses - NOT IDs or hashes)
- Use **bold** for key identifiers
- Keep it conversational but concise
- End with a helpful follow-up offer if appropriate
- NEVER show raw JSON or technical dumps
- For numerical data, highlight key metrics or trends

### Examples of Good Responses

**For user count:**
"I found 4 users in your database:

| Name | Email | Joined |
|------|-------|--------|
| John Doe | john.doe@example.com | Nov 20, 2025 |
| Jane Smith | jane.smith@example.com | Nov 20, 2025 |
| Bob Wilson | bob.wilson@example.com | Nov 20, 2025 |
| ... | ... | ... |"

**For sales data:**
"Your total sales for Q4: **$45,230**

Top 3 products:
- **Product A** - $12,500 (27%)
- **Product B** - $9,800 (22%)
- **Product C** - $7,400 (16%)"

**For order status:**
"You have 23 pending orders. Here's the breakdown:
- **15** awaiting payment
- **5** processing
- **3** ready to ship

Latest 5 orders:
[table showing most recent orders]"`,
  );
};

// Helper function to clean and structure data
function prepareDataForPresentation(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  // Remove sensitive/technical columns
  const sensitiveFields = ['password', 'clerk_id', 'id', 'uuid'];

  const cleanedRows = rows.map((row) => {
    const cleaned: Record<string, unknown> = { ...row };

    // Remove sensitive fields
    sensitiveFields.forEach((field) => {
      const lowerField = field.toLowerCase();
      if (lowerField in cleaned) {
        delete cleaned[lowerField];
      }
    });

    // Format dates
    Object.keys(cleaned).forEach((key) => {
      const value = cleaned[key];
      if (value && typeof value === 'string') {
        // Check if it's an ISO date
        if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
          cleaned[key] = new Date(value).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        }
      }
    });

    return cleaned;
  });

  return cleanedRows;
}
